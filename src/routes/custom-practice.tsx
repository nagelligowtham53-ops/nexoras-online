import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { authedFetch } from "@/lib/authed-fetch";
import { supabase } from "@/integrations/supabase/client";
import { ensureQuestionBankSeeded } from "@/lib/question-bank.functions";
import { countQuestionBank, fetchChapterCounts, fetchQuestionsWithRelaxation, gradeAnswers, type DbQuestion, type Difficulty, type GradeResult, type QuestionFilters } from "@/lib/questions";
import { chaptersFor, type Subject as SyllabusSubject } from "@/lib/jee-neet-chapters";
import {
  Atom, FlaskConical, Sigma, Dna, Timer, CheckCircle2, XCircle,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Flag, Loader2,
  Sparkles, TrendingUp, TrendingDown, ArrowRight, RotateCcw, Database,
} from "lucide-react";

export const Route = createFileRoute("/custom-practice")({
  head: () => ({
    meta: [
      { title: "Custom JEE & NEET Practice — Nexoras" },
      { name: "description", content: "Build personalized JEE & NEET practice tests from a curated question bank. Filter by chapter, difficulty, PYQ. Full analytics and AI explanations." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CustomPracticePage />
    </RequireAuth>
  ),
});

type ExamCode = "JEE Main" | "JEE Advanced" | "NEET";
type ClassSel = 11 | 12 | "both";
type Phase = "setup" | "exam" | "result";
type TimeMode = "untimed" | "timed" | "real";
type Status = "unseen" | "answered" | "review" | "skipped";

type Config = {
  exam: ExamCode;
  classSel: ClassSel;
  subjects: Record<string, string[]>;   // subject -> chapters
  count: number;
  difficulties: Difficulty[];
  pyqOnly: boolean;
  ncertOnly: boolean;
  timeMode: TimeMode;
  minutes: number;
};

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Sigma, Biology: Dna,
};

const EXAM_SUBJECTS: Record<ExamCode, string[]> = {
  "JEE Main": ["Physics", "Chemistry", "Mathematics"],
  "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
  "NEET": ["Physics", "Chemistry", "Biology"],
};

function CustomPracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [perQTime, setPerQTime] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gradedMap, setGradedMap] = useState<Record<string, GradeResult>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("question_bookmarks").select("question_id");
      setBookmarks(new Set((data ?? []).map((r) => r.question_id as string)));
    })();
  }, []);

  async function startExam(cfg: Config, qs: DbQuestion[]) {
    setConfig(cfg);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setStatuses(new Array(qs.length).fill("unseen"));
    setPerQTime(new Array(qs.length).fill(0));
    setCurrentIdx(0);
    setElapsed(0);
    // Create session record
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase.from("practice_sessions").insert({
        user_id: userData.user.id,
        mode: "custom",
        config: cfg as unknown as never,
        total_questions: qs.length,
        max_score: qs.reduce((a, q) => a + Number(q.marks), 0),
      }).select("id").single();
      if (data) setSessionId(data.id as string);
    }
    setPhase("exam");
  }

  async function submitExam() {
    setPhase("result");
    // Persist answers + wrong_questions
    if (!sessionId) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    let correct = 0, wrong = 0, skipped = 0, score = 0;
    const rows = questions.map((q, i) => {
      const pick = answers[i];
      const isSkip = pick === null;
      const ok = !isSkip && isCorrect(q, pick);
      if (isSkip) skipped++;
      else if (ok) { correct++; score += Number(q.marks); }
      else { wrong++; score -= Number(q.negative_marks); }
      return {
        session_id: sessionId,
        user_id: uid,
        question_id: q.id,
        question_order: i,
        user_answer: pick === null ? null : { value: pick } as unknown as never,
        is_correct: isSkip ? null : ok,
        is_skipped: isSkip,
        marked_for_review: statuses[i] === "review",
        time_spent_seconds: perQTime[i] ?? 0,
        awarded_marks: isSkip ? 0 : (ok ? Number(q.marks) : -Number(q.negative_marks)),
      };
    });
    await supabase.from("practice_answers").insert(rows as never);
    await supabase.from("practice_sessions").update({
      correct_count: correct, wrong_count: wrong, skipped_count: skipped,
      score, time_taken_seconds: elapsed, completed_at: new Date().toISOString(),
    }).eq("id", sessionId);
    // Wrong questions upsert
    const wrongIds = questions.filter((q, i) => answers[i] !== null && !isCorrect(q, answers[i])).map((q) => q.id);
    if (wrongIds.length) {
      // upsert with increment: use RPC or read-then-write; simple approach: fetch existing, upsert new
      const { data: existing } = await supabase.from("wrong_questions").select("question_id, wrong_count").eq("user_id", uid).in("question_id", wrongIds);
      const existMap = new Map((existing ?? []).map((r) => [r.question_id as string, r.wrong_count as number]));
      const wrongRows = wrongIds.map((qid) => ({
        user_id: uid,
        question_id: qid,
        wrong_count: (existMap.get(qid) ?? 0) + 1,
        last_wrong_at: new Date().toISOString(),
        resolved: false,
      }));
      await supabase.from("wrong_questions").upsert(wrongRows as never, { onConflict: "user_id,question_id" });
    }
  }

  function reset() { setPhase("setup"); setQuestions([]); setAnswers([]); setStatuses([]); setSessionId(null); }

  async function toggleBookmark(q: DbQuestion) {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    if (bookmarks.has(q.id)) {
      await supabase.from("question_bookmarks").delete().eq("user_id", uid).eq("question_id", q.id);
      setBookmarks((prev) => { const n = new Set(prev); n.delete(q.id); return n; });
    } else {
      await supabase.from("question_bookmarks").insert({ user_id: uid, question_id: q.id });
      setBookmarks((prev) => new Set(prev).add(q.id));
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Custom Practice"
        title="Build your own JEE / NEET test"
        description="Questions come from our curated question bank. Filter by chapter, difficulty, PYQs, or NCERT-only. Full CBT interface with analytics."
      />
      {phase === "setup" && <Setup bookmarksCount={bookmarks.size} onStart={startExam} />}
      {phase === "exam" && config && (
        <Exam
          config={config}
          questions={questions}
          answers={answers} setAnswers={setAnswers}
          statuses={statuses} setStatuses={setStatuses}
          currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}
          elapsed={elapsed} setElapsed={setElapsed}
          perQTime={perQTime} setPerQTime={setPerQTime}
          bookmarks={bookmarks} toggleBookmark={toggleBookmark}
          onSubmit={submitExam}
        />
      )}
      {phase === "result" && config && (
        <Result
          config={config} questions={questions} answers={answers}
          perQTime={perQTime} elapsed={elapsed}
          bookmarks={bookmarks} toggleBookmark={toggleBookmark}
          onReset={reset}
        />
      )}
    </PageShell>
  );
}

/* ============================== SETUP ============================== */

function Setup({ bookmarksCount, onStart }: { bookmarksCount: number; onStart: (cfg: Config, qs: DbQuestion[]) => void }) {
  const ensureSeed = useServerFn(ensureQuestionBankSeeded);
  const [exam, setExam] = useState<ExamCode>("JEE Main");
  const [classSel, setClassSel] = useState<ClassSel>("both");
  const availSubjects = EXAM_SUBJECTS[exam];
  const [subjects, setSubjects] = useState<Record<string, string[]>>({});
  const [chaptersMap, setChaptersMap] = useState<Record<string, string[]>>({});
  const [count, setCount] = useState(25);
  const [customCount, setCustomCount] = useState("");
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["Easy", "Medium", "Hard"]);
  const [pyqOnly, setPyqOnly] = useState(false);
  const [ncertOnly, setNcertOnly] = useState(false);
  const [timeMode, setTimeMode] = useState<TimeMode>("timed");
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankTotal, setBankTotal] = useState<number | null>(null);

  const [countsMap, setCountsMap] = useState<Record<string, Record<string, number>>>({});

  // Load syllabus chapters immediately + fetch DB counts per chapter
  useEffect(() => {
    setSubjects({});
    const map: Record<string, string[]> = {};
    for (const s of availSubjects) {
      map[s] = chaptersFor(s as SyllabusSubject, classSel === "both" ? "all" : (String(classSel) as "11" | "12"));
    }
    setChaptersMap(map);

    // Fetch counts from DB (best-effort; failures leave counts at 0)
    (async () => {
      setLoadingCounts(true);
      const levels = classSel === "both" ? undefined : [classSel as 11 | 12];
      try {
        await ensureSeed();
        const [total, rawCounts] = await Promise.all([
          countQuestionBank(),
          fetchChapterCounts({ exams: [exam], classLevels: levels }),
        ]);
        const next: Record<string, Record<string, number>> = {};
        for (const s of availSubjects) next[s] = rawCounts[s] ?? {};
        setBankTotal(total);
        setCountsMap(next);
      } catch (err) {
        console.error("[custom-practice] Failed to fetch chapter counts", { exam, classSel, error: err });
        const next: Record<string, Record<string, number>> = {};
        for (const s of availSubjects) next[s] = {};
        setCountsMap(next);
      } finally {
        setLoadingCounts(false);
      }
    })();
  }, [exam, classSel, availSubjects, ensureSeed]);


  function toggleChapter(subject: string, chapter: string) {
    setSubjects((prev) => {
      const cur = prev[subject] ?? [];
      const next = cur.includes(chapter) ? cur.filter((c) => c !== chapter) : [...cur, chapter];
      return { ...prev, [subject]: next };
    });
  }
  function selectAllChapters(subject: string) {
    setSubjects((p) => ({ ...p, [subject]: chaptersMap[subject] ?? [] }));
  }
  function clearSubject(subject: string) { setSubjects((p) => ({ ...p, [subject]: [] })); }

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  const totalChapters = Object.values(subjects).reduce((a, c) => a + c.length, 0);
  const selectedSubjects = Object.entries(subjects).filter(([, c]) => c.length > 0).map(([s]) => s);

  async function start() {
    setError(null);
    const finalCount = count === -1 ? Math.max(5, Math.min(200, Number(customCount) || 25)) : count;
    if (difficulties.length === 0) { setError("Pick at least one difficulty."); return; }
    setLoading(true);
    try {
      const allChapters = Object.values(subjects).flat();
      await ensureSeed();
      const filters: QuestionFilters = {
        exams: [exam],
        classLevels: classSel === "both" ? undefined : [classSel],
        subjects: selectedSubjects.length ? selectedSubjects : undefined,
        chapters: allChapters.length ? allChapters : undefined,
        difficulties,
        pyqOnly, ncertOnly,
        questionTypes: ["single_correct"], // v1 runner supports single-correct
        count: finalCount,
      };
      console.info("[custom-practice] Start Practice clicked", { appliedFilters: filters, selectedChapters: allChapters, requestedCount: finalCount });
      const result = await fetchQuestionsWithRelaxation(filters);
      console.info("[custom-practice] Question fetch summary", {
        totalQuestionsInDatabase: result.totalQuestions,
        questionsFoundAfterFiltering: result.questions.length,
        relaxedStage: result.relaxedStage,
        attempts: result.attempts,
      });
      if (result.totalQuestions === 0) throw new Error("Question bank seed did not complete.");
      if (result.questions.length === 0) {
        setError("No matching questions were found after checking all safe filter combinations. Try a different exam or class.");
        setLoading(false);
        return;
      }
      const qs = result.questions;
      const realMin = exam === "NEET" ? Math.round(qs.length * 1.08) : Math.round(qs.length * 1.2);
      const finalMinutes = timeMode === "real" ? realMin : timeMode === "timed" ? minutes : 0;
      onStart(
        { exam, classSel, subjects, count: qs.length, difficulties, pyqOnly, ncertOnly, timeMode, minutes: finalMinutes },
        qs,
      );
    } catch (e) {
      console.error("[custom-practice] Failed to start practice", e);
      setError("We could not start practice right now. Please try again in a moment.");
    } finally { setLoading(false); }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-accent" />
          Questions are served from Nexoras' curated question bank — no AI generation during practice.
        </div>
        <div className="flex gap-3 text-xs">
          <span>{bankTotal === null ? "Checking bank…" : `${bankTotal} questions available`}</span>
          {bookmarksCount > 0 && <span>{bookmarksCount} bookmarked</span>}
          <Link to="/practice-history" className="text-accent underline">History & analytics</Link>
        </div>
      </div>

      <div className="glass space-y-6 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">1 · Exam & Class</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["JEE Main", "JEE Advanced", "NEET"] as ExamCode[]).map((e) => (
            <Picker key={e} label={e} active={exam === e} onClick={() => setExam(e)} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Picker label="Class 11" active={classSel === 11} onClick={() => setClassSel(11)} />
          <Picker label="Class 12" active={classSel === 12} onClick={() => setClassSel(12)} />
          <Picker label="Both (11 + 12)" active={classSel === "both"} onClick={() => setClassSel("both")} />
        </div>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">2 · Subjects & Chapters</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {availSubjects.map((s) => {
            const Icon = SUBJECT_ICONS[s] ?? Database;
            const chapters = chaptersMap[s] ?? [];
            const counts = countsMap[s] ?? {};
            const selected = subjects[s] ?? [];
            const totalQs = Object.values(counts).reduce((a, b) => a + b, 0);
            return (
              <div key={s} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-accent" /> {s}
                    <span className="text-xs text-muted-foreground">
                      ({selected.length}/{chapters.length}) · {totalQs} Qs
                    </span>
                  </div>
                  <div className="flex gap-1.5 text-[11px]">
                    <button onClick={() => selectAllChapters(s)} className="rounded border border-border px-2 py-0.5 hover:border-accent/40">All</button>
                    <button onClick={() => clearSubject(s)} className="rounded border border-border px-2 py-0.5 hover:border-accent/40">Clear</button>
                  </div>
                </div>
                <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {chapters.map((c) => {
                    const on = selected.includes(c);
                    const n = counts[c] ?? 0;
                    return (
                      <button key={c} onClick={() => toggleChapter(s, c)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${on ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/60 hover:border-accent/40"}`}>
                        <span>{c}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${on ? "bg-black/20" : n > 0 ? "bg-accent/15 text-accent" : "bg-muted/50 text-muted-foreground"}`}>
                          {loadingCounts ? "…" : `${n} ${n === 1 ? "Q" : "Qs"}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
        <p className="text-xs text-muted-foreground">
          {selectedSubjects.length === 0
            ? "No subjects selected — all subjects will be included."
            : `${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} · ${totalChapters} chapter${totalChapters === 1 ? "" : "s"} selected`}
        </p>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">3 · Questions & Difficulty</h2>
        <div className="flex flex-wrap gap-2">
          {[10, 25, 50, 100].map((n) => (
            <Picker key={n} label={`${n} Questions`} active={count === n} onClick={() => setCount(n)} />
          ))}
          <Picker label="Custom" active={count === -1} onClick={() => setCount(-1)} />
          {count === -1 && (
            <input type="number" min={5} max={200} value={customCount} onChange={(e) => setCustomCount(e.target.value)}
              placeholder="5 – 200" className="w-28 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <Picker key={d} label={d} active={difficulties.includes(d)} onClick={() => toggleDifficulty(d)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Picker label="Previous Year Only" active={pyqOnly} onClick={() => setPyqOnly((v) => !v)} />
          <Picker label="NCERT-based Only" active={ncertOnly} onClick={() => setNcertOnly((v) => !v)} />
          <Picker label="Mixed" active={!pyqOnly && !ncertOnly} onClick={() => { setPyqOnly(false); setNcertOnly(false); }} />
        </div>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">4 · Time Mode</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Picker label="Untimed Practice" active={timeMode === "untimed"} onClick={() => setTimeMode("untimed")} />
          <Picker label="Timed Practice" active={timeMode === "timed"} onClick={() => setTimeMode("timed")} />
          <Picker label="Real Exam Simulation" active={timeMode === "real"} onClick={() => setTimeMode("real")} />
        </div>
        {timeMode === "timed" && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Duration (min):</span>
            <input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 30)))}
              className="w-24 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm" />
          </div>
        )}
        {timeMode === "real" && (
          <p className="text-xs text-muted-foreground">Duration auto-calibrated to {exam === "NEET" ? "≈1 min/Q (NEET)" : "≈1.2 min/Q (JEE)"}.</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <p>{error}</p>
          {error.includes("0 questions") && (
            <Link to="/admin/questions" className="mt-2 inline-flex text-accent underline">
              Import Questions
            </Link>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={start} disabled={loading} className="bg-gradient-primary text-primary-foreground shadow-glow">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : <>Start practice <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </section>
  );
}

function Picker({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${active ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/40 hover:border-accent/40"}`}>
      {label}
    </button>
  );
}

/* ============================== EXAM ============================== */

function Exam({
  config, questions, answers, setAnswers, statuses, setStatuses,
  currentIdx, setCurrentIdx, elapsed, setElapsed, perQTime, setPerQTime,
  bookmarks, toggleBookmark, onSubmit,
}: {
  config: Config;
  questions: DbQuestion[];
  answers: (number | null)[];
  setAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  statuses: Status[];
  setStatuses: React.Dispatch<React.SetStateAction<Status[]>>;
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  elapsed: number;
  setElapsed: React.Dispatch<React.SetStateAction<number>>;
  perQTime: number[];
  setPerQTime: React.Dispatch<React.SetStateAction<number[]>>;
  bookmarks: Set<string>;
  toggleBookmark: (q: DbQuestion) => void;
  onSubmit: () => void;
}) {
  const submittedRef = useRef(false);
  const lastIdxRef = useRef(currentIdx);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((s) => s + 1);
      setPerQTime((prev) => { const n = [...prev]; n[lastIdxRef.current] = (n[lastIdxRef.current] ?? 0) + 1; return n; });
    }, 1000);
    return () => clearInterval(t);
  }, [setElapsed, setPerQTime]);

  useEffect(() => { lastIdxRef.current = currentIdx; }, [currentIdx]);

  const totalSeconds = config.minutes > 0 ? config.minutes * 60 : 0;
  const remaining = totalSeconds > 0 ? Math.max(0, totalSeconds - elapsed) : null;

  useEffect(() => {
    if (remaining === 0 && !submittedRef.current) { submittedRef.current = true; onSubmit(); }
  }, [remaining, onSubmit]);

  useEffect(() => {
    setStatuses((prev) => {
      if (prev[currentIdx] === "unseen") { const n = [...prev]; n[currentIdx] = "skipped"; return n; }
      return prev;
    });
  }, [currentIdx, setStatuses]);

  const q = questions[currentIdx];
  const Icon = SUBJECT_ICONS[q.subject] ?? Database;

  function pick(i: number) {
    setAnswers((prev) => { const n = [...prev]; n[currentIdx] = i; return n; });
    setStatuses((prev) => { const n = [...prev]; if (n[currentIdx] !== "review") n[currentIdx] = "answered"; return n; });
  }
  function clearAnswer() {
    setAnswers((prev) => { const n = [...prev]; n[currentIdx] = null; return n; });
    setStatuses((prev) => { const n = [...prev]; n[currentIdx] = "skipped"; return n; });
  }
  function markReview() {
    setStatuses((prev) => { const n = [...prev]; n[currentIdx] = "review"; return n; });
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isBk = bookmarks.has(q.id);

  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 lg:grid-cols-[1fr_280px] lg:px-8">
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">Q {currentIdx + 1} / {questions.length}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5">
              <Icon className="h-3 w-3" /> {q.subject}
            </span>
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">{q.chapter}</span>
            <span className={`rounded-full px-2 py-0.5 ${q.difficulty === "Hard" ? "border border-destructive/40 text-destructive" : q.difficulty === "Medium" ? "border border-accent/40 text-accent" : "border border-border text-muted-foreground"}`}>{q.difficulty}</span>
            {q.is_pyq && q.year && <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-accent">PYQ {q.year}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleBookmark(q)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:border-accent/40">
              {isBk ? <BookmarkCheck className="h-3.5 w-3.5 text-accent" /> : <Bookmark className="h-3.5 w-3.5" />}
              {isBk ? "Saved" : "Save"}
            </button>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${remaining !== null && remaining < 60 ? "border-destructive/40 text-destructive" : "border-border"}`}>
              <Timer className="h-3.5 w-3.5" />
              {remaining !== null ? fmtTime(remaining) : fmtTime(elapsed)}
            </span>
          </div>
        </div>

        <h3 className="text-base font-medium leading-relaxed sm:text-lg">{q.question_text}</h3>

        <div className="mt-5 grid gap-2">
          {(q.options ?? []).map((opt, i) => {
            const isPicked = answers[currentIdx] === i;
            return (
              <button key={i} onClick={() => pick(i)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${isPicked ? "border-accent/60 bg-accent/10" : "border-border bg-background/40 hover:border-accent/40"}`}>
                <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={clearAnswer} disabled={answers[currentIdx] === null}>Clear</Button>
            <Button variant="outline" size="sm" onClick={markReview}><Flag className="h-4 w-4" /> Mark for review</Button>
          </div>
          <div className="flex gap-2">
            {currentIdx < questions.length - 1 ? (
              <Button size="sm" onClick={() => setCurrentIdx(currentIdx + 1)} className="bg-gradient-primary text-primary-foreground">
                Save & Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={onSubmit} className="bg-gradient-primary text-primary-foreground">Submit test</Button>
            )}
          </div>
        </div>
      </div>

      <aside className="glass h-fit rounded-2xl p-4 lg:sticky lg:top-20">
        <div className="mb-3 text-xs font-semibold">Question Palette</div>
        <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
          {questions.map((_, i) => {
            const st = statuses[i];
            const cur = i === currentIdx;
            const cls =
              cur ? "border-accent ring-2 ring-accent/40" :
              st === "answered" ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" :
              st === "review" ? "border-amber-500/60 bg-amber-500/15 text-amber-300" :
              st === "skipped" ? "border-destructive/60 bg-destructive/10 text-destructive" :
              "border-border bg-background/40";
            return (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`h-8 w-8 rounded-md border text-xs font-medium ${cls}`}>{i + 1}</button>
            );
          })}
        </div>
        <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
          <Legend dot="bg-emerald-500" label="Answered" />
          <Legend dot="bg-amber-500" label="Marked for review" />
          <Legend dot="bg-destructive" label="Skipped" />
          <Legend dot="bg-muted-foreground/40" label="Unseen" />
        </div>
        <Button size="sm" onClick={onSubmit} className="mt-4 w-full bg-gradient-primary text-primary-foreground">Submit test</Button>
      </aside>
    </section>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${dot}`} /> {label}</div>;
}

/* ============================== RESULT ============================== */

function Result({
  config, questions, answers, perQTime, elapsed, bookmarks, toggleBookmark, onReset,
}: {
  config: Config;
  questions: DbQuestion[];
  answers: (number | null)[];
  perQTime: number[];
  elapsed: number;
  bookmarks: Set<string>;
  toggleBookmark: (q: DbQuestion) => void;
  onReset: () => void;
}) {
  const stats = useMemo(() => {
    let correct = 0, wrong = 0, attempted = 0, score = 0, maxScore = 0;
    const byChapter = new Map<string, { subject: string; chapter: string; total: number; correct: number }>();
    questions.forEach((q, i) => {
      maxScore += Number(q.marks);
      const key = `${q.subject}::${q.chapter}`;
      const row = byChapter.get(key) ?? { subject: q.subject, chapter: q.chapter, total: 0, correct: 0 };
      row.total += 1;
      const pick = answers[i];
      if (pick !== null) {
        attempted += 1;
        if (isCorrect(q, pick)) { correct += 1; row.correct += 1; score += Number(q.marks); }
        else { wrong += 1; score -= Number(q.negative_marks); }
      }
      byChapter.set(key, row);
    });
    const chapters = [...byChapter.values()].map((r) => ({ ...r, accuracy: r.total ? r.correct / r.total : 0 }));
    chapters.sort((a, b) => a.accuracy - b.accuracy);
    const weak = chapters.filter((c) => c.accuracy < 0.6).slice(0, 5);
    const strong = [...chapters].reverse().filter((c) => c.accuracy >= 0.8).slice(0, 5);
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const avgTime = attempted ? Math.round(elapsed / attempted) : 0;
    return { correct, wrong, attempted, total: questions.length, accuracy, weak, strong, chapters, score, maxScore, avgTime };
  }, [questions, answers, elapsed]);

  const [reco, setReco] = useState<{ summary?: string; revisionPlan?: { day: number; focus: string; tasks: string[] }[]; practiceTips?: string[] } | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoErr, setRecoErr] = useState<string | null>(null);

  async function getReco() {
    setRecoLoading(true); setRecoErr(null);
    try {
      const res = await authedFetch("/api/study-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: config.exam, weak: stats.weak, strong: stats.strong,
          score: stats.correct, total: stats.total,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRecoErr(data.error || "Failed"); return; }
      setReco(data);
    } catch { setRecoErr("Network error"); }
    finally { setRecoLoading(false); }
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card label="Score" value={`${stats.score.toFixed(1)} / ${stats.maxScore}`} />
        <Card label="Accuracy" value={`${stats.accuracy}%`} />
        <Card label="Attempted" value={`${stats.attempted}/${stats.total}`} />
        <Card label="Avg / Q" value={`${stats.avgTime}s`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingDown className="h-4 w-4 text-destructive" /> Weak chapters
          </h3>
          {stats.weak.length === 0
            ? <p className="text-xs text-muted-foreground">No clear weak chapters. Great job!</p>
            : stats.weak.map((c) => <Row key={c.chapter} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="weak" />)}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Strong chapters
          </h3>
          {stats.strong.length === 0
            ? <p className="text-xs text-muted-foreground">Keep practising to build strengths.</p>
            : stats.strong.map((c) => <Row key={c.chapter} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="strong" />)}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> AI Study Plan</h3>
          {!reco && (
            <Button size="sm" onClick={getReco} disabled={recoLoading} className="bg-gradient-primary text-primary-foreground">
              {recoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate plan"}
            </Button>
          )}
        </div>
        {recoErr && <p className="text-xs text-destructive">{recoErr}</p>}
        {reco?.summary && <p className="text-sm text-muted-foreground">{reco.summary}</p>}
        {reco?.revisionPlan && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {reco.revisionPlan.map((d) => (
              <div key={d.day} className="rounded-xl border border-border bg-background/40 p-3">
                <p className="text-xs font-semibold text-accent">Day {d.day}</p>
                <p className="mt-1 text-xs font-medium">{d.focus}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                  {d.tasks.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold">Review answers</h3>
        <div className="space-y-3">
          {questions.map((q, i) => <ReviewRow key={q.id} q={q} pick={answers[i]} timeSpent={perQTime[i] ?? 0} isBk={bookmarks.has(q.id)} toggleBookmark={toggleBookmark} />)}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link to="/practice-history"><Button variant="outline">View history</Button></Link>
        <Button variant="outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> New custom test</Button>
      </div>
    </section>
  );
}

function ReviewRow({ q, pick, timeSpent, isBk, toggleBookmark }:
  { q: DbQuestion; pick: number | null; timeSpent: number; isBk: boolean; toggleBookmark: (q: DbQuestion) => void }) {
  const correctIdx = q.correct_answer.type === "single" ? q.correct_answer.value : -1;
  const correct = pick !== null && isCorrect(q, pick);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askAI(mode: "explain" | "hint" | "alt-method" | "mistake") {
    setAiLoading(true);
    try {
      const res = await authedFetch("/api/explain-question", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question_text, options: q.options ?? [],
          correctAnswer: correctIdx >= 0 && q.options ? q.options[correctIdx] : "",
          subject: q.subject, chapter: q.chapter,
          userAnswer: pick !== null && q.options ? q.options[pick] : "",
          mode,
        }),
      });
      const data = await res.json();
      setAiText(res.ok ? data.text : `Error: ${data.error}`);
    } catch { setAiText("Network error"); }
    finally { setAiLoading(false); }
  }

  return (
    <details className="rounded-xl border border-border bg-background/30 p-3 text-sm">
      <summary className="flex cursor-pointer items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {pick === null ? <span className="text-muted-foreground">·</span>
            : correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : <XCircle className="h-4 w-4 text-destructive" />}
          <span className="font-medium">Q.</span>
          <span className="line-clamp-1 text-muted-foreground">{q.question_text}</span>
        </span>
        <span className="text-[10px] text-muted-foreground">{q.subject} · {q.chapter} · {timeSpent}s</span>
      </summary>
      <div className="mt-3 space-y-1.5">
        {(q.options ?? []).map((o, idx) => (
          <div key={idx} className={`rounded-md border px-3 py-1.5 text-xs ${idx === correctIdx ? "border-emerald-500/40 bg-emerald-500/10" : idx === pick ? "border-destructive/40 bg-destructive/10" : "border-border"}`}>
            <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>{o}
          </div>
        ))}
        {q.solution && <p className="pt-2 text-xs"><strong className="text-accent">Solution:</strong> <span className="text-muted-foreground">{q.solution}</span></p>}
        {q.explanation && <p className="text-xs"><strong className="text-accent">Concept:</strong> <span className="text-muted-foreground">{q.explanation}</span></p>}

        <div className="flex flex-wrap gap-1.5 pt-2">
          <button onClick={() => askAI("explain")} disabled={aiLoading} className="rounded border border-border px-2 py-0.5 text-[11px] hover:border-accent/40">
            {aiLoading ? "…" : "AI step-by-step"}
          </button>
          <button onClick={() => askAI("alt-method")} disabled={aiLoading} className="rounded border border-border px-2 py-0.5 text-[11px] hover:border-accent/40">Alt method</button>
          <button onClick={() => askAI("mistake")} disabled={aiLoading} className="rounded border border-border px-2 py-0.5 text-[11px] hover:border-accent/40">Common mistakes</button>
          <button onClick={() => toggleBookmark(q)} className="ml-auto inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] hover:border-accent/40">
            {isBk ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3" />}
            {isBk ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
        {aiText && <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs whitespace-pre-wrap">{aiText}</div>}
      </div>
    </details>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({ label, pct, tone }: { label: string; pct: number; tone: "weak" | "strong" }) {
  const color = tone === "weak" ? "bg-destructive" : "bg-emerald-500";
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{pct}%</span></div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
