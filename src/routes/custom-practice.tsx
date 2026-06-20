import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { authedFetch } from "@/lib/authed-fetch";
import {
  chaptersFor,
  subjectsForExam,
  type ExamTrack,
  type ClassLevel,
  type Subject,
} from "@/lib/jee-neet-chapters";
import {
  Atom, FlaskConical, Sigma, Dna, Timer, CheckCircle2, XCircle,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Flag, Loader2,
  Sparkles, TrendingUp, TrendingDown, ArrowRight, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/custom-practice")({
  head: () => ({
    meta: [
      { title: "Custom JEE & NEET Practice — Build Your Own Test | Nexoras" },
      { name: "description", content: "Build personalized JEE & NEET practice tests. Pick subjects, chapters, difficulty, and timer. CBT interface with palette, bookmarks, analytics & AI study plan." },
    ],
  }),
  component: () => (
    <PremiumGate feature="Custom Practice">
      <CustomPracticePage />
    </PremiumGate>
  ),
});

type Question = {
  subject: Subject;
  chapter: string;
  level: "Easy" | "Medium" | "Hard";
  q: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Status = "unseen" | "answered" | "review" | "skipped";

type Phase = "setup" | "exam" | "result";

type TimeMode = "untimed" | "timed" | "real";

type Config = {
  exam: ExamTrack;
  classLevel: ClassLevel;
  subjects: Record<Subject, string[]>; // subject -> chapters
  count: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  timeMode: TimeMode;
  minutes: number; // for timed
};

const ICONS: Record<Subject, React.ComponentType<{ className?: string }>> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Sigma, Biology: Dna,
};

const EXAM_LABELS: Record<ExamTrack, string> = {
  "jee-main": "JEE Main",
  "jee-adv": "JEE Advanced",
  "neet": "NEET",
};

const BOOKMARK_KEY = "nexoras_practice_bookmarks_v1";

function loadBookmarks(): Question[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); } catch { return []; }
}
function saveBookmarks(b: Question[]) {
  try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(b)); } catch { /* noop */ }
}

function CustomPracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bookmarks, setBookmarks] = useState<Question[]>([]);

  useEffect(() => { setBookmarks(loadBookmarks()); }, []);

  function startExam(cfg: Config, qs: Question[]) {
    setConfig(cfg);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setStatuses(new Array(qs.length).fill("unseen"));
    setCurrentIdx(0);
    setElapsed(0);
    setPhase("exam");
  }

  function submitExam() { setPhase("result"); }

  function reset() { setPhase("setup"); setQuestions([]); setAnswers([]); setStatuses([]); }

  function toggleBookmark(q: Question) {
    setBookmarks((prev) => {
      const exists = prev.some((p) => p.q === q.q);
      const next = exists ? prev.filter((p) => p.q !== q.q) : [...prev, q];
      saveBookmarks(next);
      return next;
    });
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Custom Practice"
        title="Build your own JEE / NEET test"
        description="Pick subjects, chapters, difficulty, count and timer. Practice on a real CBT-style interface with analytics and an AI study plan."
      />
      {phase === "setup" && (
        <Setup
          bookmarksCount={bookmarks.length}
          onStart={startExam}
        />
      )}
      {phase === "exam" && config && (
        <Exam
          config={config}
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          statuses={statuses}
          setStatuses={setStatuses}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          elapsed={elapsed}
          setElapsed={setElapsed}
          bookmarks={bookmarks}
          toggleBookmark={toggleBookmark}
          onSubmit={submitExam}
        />
      )}
      {phase === "result" && config && (
        <Result
          config={config}
          questions={questions}
          answers={answers}
          elapsed={elapsed}
          bookmarks={bookmarks}
          toggleBookmark={toggleBookmark}
          onReset={reset}
        />
      )}
    </PageShell>
  );
}

/* ------------------------------- SETUP ------------------------------- */

function Setup({
  bookmarksCount,
  onStart,
}: {
  bookmarksCount: number;
  onStart: (cfg: Config, qs: Question[]) => void;
}) {
  const [exam, setExam] = useState<ExamTrack>("jee-main");
  const [classLevel, setClassLevel] = useState<ClassLevel>("all");
  const subjectsAvail = subjectsForExam(exam);
  const [subjects, setSubjects] = useState<Record<Subject, string[]>>(
    () => Object.fromEntries(subjectsAvail.map((s) => [s, []])) as Record<Subject, string[]>,
  );
  const [count, setCount] = useState(25);
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState<Config["difficulty"]>("mixed");
  const [timeMode, setTimeMode] = useState<TimeMode>("timed");
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset subject selection if exam changes
  useEffect(() => {
    setSubjects(Object.fromEntries(subjectsForExam(exam).map((s) => [s, []])) as Record<Subject, string[]>);
  }, [exam]);

  function toggleChapter(subject: Subject, chapter: string) {
    setSubjects((prev) => {
      const cur = prev[subject] ?? [];
      const next = cur.includes(chapter) ? cur.filter((c) => c !== chapter) : [...cur, chapter];
      return { ...prev, [subject]: next };
    });
  }
  function selectAll(subject: Subject) {
    setSubjects((prev) => ({ ...prev, [subject]: chaptersFor(subject, classLevel) }));
  }
  function clearSubject(subject: Subject) {
    setSubjects((prev) => ({ ...prev, [subject]: [] }));
  }

  const totalChapters = Object.values(subjects).reduce((a, c) => a + c.length, 0);

  async function start() {
    setError(null);
    const selected = Object.entries(subjects)
      .filter(([, ch]) => ch.length > 0)
      .map(([s, ch]) => ({ subject: s, chapters: ch }));
    if (selected.length === 0) { setError("Pick at least one chapter."); return; }
    const finalCount = count === -1 ? Math.max(5, Math.min(100, Number(customCount) || 25)) : count;
    setLoading(true);
    try {
      const res = await authedFetch("/api/generate-custom-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: EXAM_LABELS[exam],
          classLevel,
          subjects: selected,
          count: finalCount,
          difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate"); setLoading(false); return; }
      const qs: Question[] = (data.questions || []).map((q: Record<string, unknown>) => ({
        subject: q.subject as Subject,
        chapter: String(q.chapter ?? "General"),
        level: (q.level as Question["level"]) ?? "Medium",
        q: String(q.q ?? ""),
        options: Array.isArray(q.options) ? (q.options as string[]).slice(0, 4) : [],
        correct: Number(q.correct ?? 0),
        explanation: String(q.explanation ?? ""),
      })).filter((q: Question) => q.q && q.options.length === 4);
      if (qs.length === 0) { setError("AI returned no valid questions. Try again."); setLoading(false); return; }
      const realMin = exam === "neet" ? Math.round(qs.length * 1.08) : Math.round(qs.length * 1.2);
      const finalMinutes = timeMode === "real" ? realMin : timeMode === "timed" ? minutes : 0;
      onStart(
        { exam, classLevel, subjects, count: qs.length, difficulty, timeMode, minutes: finalMinutes },
        qs,
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      {bookmarksCount > 0 && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sm">
            <BookmarkCheck className="h-4 w-4 text-accent" />
            You have <strong>{bookmarksCount}</strong> bookmarked question{bookmarksCount === 1 ? "" : "s"}.
          </div>
          <Link to="/custom-practice" hash="bookmarks" className="text-xs text-accent underline">
            Use them as a revision set below
          </Link>
        </div>
      )}

      <div className="glass space-y-6 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">1 · Exam & Class</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Picker label="JEE Main" active={exam === "jee-main"} onClick={() => setExam("jee-main")} />
          <Picker label="JEE Advanced" active={exam === "jee-adv"} onClick={() => setExam("jee-adv")} />
          <Picker label="NEET" active={exam === "neet"} onClick={() => setExam("neet")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Picker label={exam === "neet" ? "Class 11 NEET" : "Class 11 JEE"} active={classLevel === "11"} onClick={() => setClassLevel("11")} />
          <Picker label={exam === "neet" ? "Class 12 NEET" : "Class 12 JEE"} active={classLevel === "12"} onClick={() => setClassLevel("12")} />
          <Picker label={exam === "neet" ? "Full NEET" : exam === "jee-adv" ? "Full JEE Advanced" : "Full JEE Main"} active={classLevel === "all"} onClick={() => setClassLevel("all")} />
        </div>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">2 · Subjects & Chapters</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {subjectsAvail.map((s) => {
            const Icon = ICONS[s];
            const chapters = chaptersFor(s, classLevel);
            const selected = subjects[s] ?? [];
            return (
              <div key={s} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-accent" /> {s}
                    <span className="text-xs text-muted-foreground">({selected.length}/{chapters.length})</span>
                  </div>
                  <div className="flex gap-1.5 text-[11px]">
                    <button onClick={() => selectAll(s)} className="rounded border border-border px-2 py-0.5 hover:border-accent/40">All</button>
                    <button onClick={() => clearSubject(s)} className="rounded border border-border px-2 py-0.5 hover:border-accent/40">Clear</button>
                  </div>
                </div>
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {chapters.map((c) => {
                    const on = selected.includes(c);
                    return (
                      <button key={c} onClick={() => toggleChapter(s, c)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${on ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/60 hover:border-accent/40"}`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{totalChapters} chapter{totalChapters === 1 ? "" : "s"} selected</p>
      </div>

      <div className="glass space-y-4 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">3 · Questions</h2>
        <div className="flex flex-wrap gap-2">
          {[10, 25, 50, 100].map((n) => (
            <Picker key={n} label={`${n} Questions`} active={count === n} onClick={() => setCount(n)} />
          ))}
          <Picker label="Custom" active={count === -1} onClick={() => setCount(-1)} />
          {count === -1 && (
            <input
              type="number" min={5} max={100} value={customCount} onChange={(e) => setCustomCount(e.target.value)}
              placeholder="5 – 100"
              className="w-28 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {(["easy", "medium", "hard", "mixed"] as const).map((d) => (
            <Picker key={d} label={d[0].toUpperCase() + d.slice(1)} active={difficulty === d} onClick={() => setDifficulty(d)} />
          ))}
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
          <p className="text-xs text-muted-foreground">Duration auto-calibrated to {exam === "neet" ? "≈1 min/Q (NEET)" : "≈1.2 min/Q (JEE)"}.</p>
        )}
      </div>

      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex justify-end">
        <Button onClick={start} disabled={loading} className="bg-gradient-primary text-primary-foreground shadow-glow">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <>Start practice <ArrowRight className="h-4 w-4" /></>}
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

/* ------------------------------- EXAM ------------------------------- */

function Exam({
  config, questions, answers, setAnswers, statuses, setStatuses,
  currentIdx, setCurrentIdx, elapsed, setElapsed, bookmarks, toggleBookmark, onSubmit,
}: {
  config: Config;
  questions: Question[];
  answers: (number | null)[];
  setAnswers: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  statuses: Status[];
  setStatuses: React.Dispatch<React.SetStateAction<Status[]>>;
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  elapsed: number;
  setElapsed: React.Dispatch<React.SetStateAction<number>>;
  bookmarks: Question[];
  toggleBookmark: (q: Question) => void;
  onSubmit: () => void;
}) {
  const submittedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [setElapsed]);

  const totalSeconds = config.minutes > 0 ? config.minutes * 60 : 0;
  const remaining = totalSeconds > 0 ? Math.max(0, totalSeconds - elapsed) : null;

  useEffect(() => {
    if (remaining === 0 && !submittedRef.current) {
      submittedRef.current = true;
      onSubmit();
    }
  }, [remaining, onSubmit]);

  // mark current as skipped when visiting unseen
  useEffect(() => {
    setStatuses((prev) => {
      if (prev[currentIdx] === "unseen") {
        const next = [...prev]; next[currentIdx] = "skipped"; return next;
      }
      return prev;
    });
  }, [currentIdx, setStatuses]);

  const q = questions[currentIdx];
  const Icon = ICONS[q.subject];

  function pick(i: number) {
    setAnswers((prev) => { const n = [...prev]; n[currentIdx] = i; return n; });
    setStatuses((prev) => {
      const n = [...prev];
      if (n[currentIdx] !== "review") n[currentIdx] = "answered";
      return n;
    });
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
  const isBookmarked = bookmarks.some((b) => b.q === q.q);

  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 lg:grid-cols-[1fr_280px] lg:px-8">
      {/* Question pane */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">Q {currentIdx + 1} / {questions.length}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5">
              <Icon className="h-3 w-3" /> {q.subject}
            </span>
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">{q.chapter}</span>
            <span className={`rounded-full px-2 py-0.5 ${q.level === "Hard" ? "border border-destructive/40 text-destructive" : q.level === "Medium" ? "border border-accent/40 text-accent" : "border border-border text-muted-foreground"}`}>{q.level}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleBookmark(q)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:border-accent/40">
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-accent" /> : <Bookmark className="h-3.5 w-3.5" />}
              {isBookmarked ? "Saved" : "Save"}
            </button>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${remaining !== null && remaining < 60 ? "border-destructive/40 text-destructive" : "border-border"}`}>
              <Timer className="h-3.5 w-3.5" />
              {remaining !== null ? fmtTime(remaining) : fmtTime(elapsed)}
            </span>
          </div>
        </div>

        <h3 className="text-base font-medium leading-relaxed sm:text-lg">{q.q}</h3>

        <div className="mt-5 grid gap-2">
          {q.options.map((opt, i) => {
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
            <Button variant="outline" size="sm" onClick={markReview}>
              <Flag className="h-4 w-4" /> Mark for review
            </Button>
          </div>
          <div className="flex gap-2">
            {currentIdx < questions.length - 1 ? (
              <Button size="sm" onClick={() => setCurrentIdx(currentIdx + 1)} className="bg-gradient-primary text-primary-foreground">
                Save & Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={onSubmit} className="bg-gradient-primary text-primary-foreground">
                Submit test
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Palette */}
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

/* ------------------------------- RESULT ------------------------------- */

type Reco = {
  summary?: string;
  revisionPlan?: { day: number; focus: string; tasks: string[] }[];
  chaptersToRevise?: string[];
  practiceTips?: string[];
};

function Result({
  config, questions, answers, elapsed, bookmarks, toggleBookmark, onReset,
}: {
  config: Config;
  questions: Question[];
  answers: (number | null)[];
  elapsed: number;
  bookmarks: Question[];
  toggleBookmark: (q: Question) => void;
  onReset: () => void;
}) {
  const stats = useMemo(() => {
    let correct = 0, wrong = 0, attempted = 0;
    const byChapter = new Map<string, { subject: Subject; chapter: string; total: number; correct: number }>();
    questions.forEach((q, i) => {
      const key = `${q.subject}::${q.chapter}`;
      const row = byChapter.get(key) ?? { subject: q.subject, chapter: q.chapter, total: 0, correct: 0 };
      row.total += 1;
      if (answers[i] !== null) {
        attempted += 1;
        if (answers[i] === q.correct) { correct += 1; row.correct += 1; }
        else wrong += 1;
      }
      byChapter.set(key, row);
    });
    const chapters = [...byChapter.values()].map((r) => ({ ...r, accuracy: r.total ? r.correct / r.total : 0 }));
    chapters.sort((a, b) => a.accuracy - b.accuracy);
    const weak = chapters.filter((c) => c.accuracy < 0.6).slice(0, 5);
    const strong = [...chapters].reverse().filter((c) => c.accuracy >= 0.8).slice(0, 5);
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    return { correct, wrong, attempted, total: questions.length, accuracy, weak, strong, chapters };
  }, [questions, answers]);

  const [reco, setReco] = useState<Reco | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoErr, setRecoErr] = useState<string | null>(null);

  async function getReco() {
    setRecoLoading(true); setRecoErr(null);
    try {
      const res = await authedFetch("/api/study-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: EXAM_LABELS[config.exam],
          weak: stats.weak, strong: stats.strong,
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
        <Card label="Score" value={`${stats.correct}/${stats.total}`} />
        <Card label="Accuracy" value={`${stats.accuracy}%`} />
        <Card label="Attempted" value={`${stats.attempted}`} />
        <Card label="Time" value={fmtTime(elapsed)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingDown className="h-4 w-4 text-destructive" /> Weak chapters
          </h3>
          {stats.weak.length === 0 ? (
            <p className="text-xs text-muted-foreground">No clear weak chapters. Great job!</p>
          ) : stats.weak.map((c) => (
            <Row key={c.chapter} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="weak" />
          ))}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Strong chapters
          </h3>
          {stats.strong.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keep practising to build strengths.</p>
          ) : stats.strong.map((c) => (
            <Row key={c.chapter} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="strong" />
          ))}
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
        {reco?.practiceTips && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {reco.practiceTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold">Review answers</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const picked = answers[i];
            const correct = picked === q.correct;
            const isBk = bookmarks.some((b) => b.q === q.q);
            return (
              <details key={i} className="rounded-xl border border-border bg-background/30 p-3 text-sm">
                <summary className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {picked === null ? <span className="text-muted-foreground">·</span>
                      : correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="font-medium">Q{i + 1}.</span>
                    <span className="line-clamp-1 text-muted-foreground">{q.q}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">{q.subject} · {q.chapter}</span>
                </summary>
                <div className="mt-3 space-y-1.5">
                  {q.options.map((o, idx) => (
                    <div key={idx} className={`rounded-md border px-3 py-1.5 text-xs ${idx === q.correct ? "border-emerald-500/40 bg-emerald-500/10" : idx === picked ? "border-destructive/40 bg-destructive/10" : "border-border"}`}>
                      <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>{o}
                    </div>
                  ))}
                  <p className="pt-2 text-xs text-muted-foreground"><strong className="text-accent">Why:</strong> {q.explanation}</p>
                  <button onClick={() => toggleBookmark(q)} className="mt-1 inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] hover:border-accent/40">
                    {isBk ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3" />}
                    {isBk ? "Bookmarked" : "Bookmark"}
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> New custom test</Button>
      </div>
    </section>
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
