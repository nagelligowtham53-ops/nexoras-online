import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuestionsWithRelaxation, isCorrect, type DbQuestion, type Difficulty } from "@/lib/questions";
import { Atom, FlaskConical, Sigma, Dna, CheckCircle2, XCircle, Timer, ArrowRight, Sparkles, Bookmark, BookmarkCheck, Loader2, Database } from "lucide-react";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "JEE & NEET Quick Practice — Nexoras" },
      { name: "description", content: "Rapid single-question practice from the Nexoras question bank. Filter by subject and difficulty; get instant AI-powered explanations." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PracticePage />
    </RequireAuth>
  ),
});

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Sigma, Biology: Dna,
};

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics", "Biology"] as const;
const LEVELS = ["All", "Easy", "Medium", "Hard"] as const;

function PracticePage() {
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("All");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [pool, setPool] = useState<DbQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [seconds, setSeconds] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, [subject, level]); // eslint-disable-line
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("question_bookmarks").select("question_id");
      setBookmarks(new Set((data ?? []).map((r) => r.question_id as string)));
    })();
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const result = await fetchQuestionsWithRelaxation({
        subjects: subject === "All" ? undefined : [subject],
        difficulties: level === "All" ? undefined : [level as Difficulty],
        questionTypes: ["single_correct"],
        count: 20,
      });
      const qs = result.questions;
      console.info("[practice] Question fetch summary", {
        totalQuestionsInDatabase: result.totalQuestions,
        questionsFoundAfterFiltering: qs.length,
        appliedFilters: { subject, level },
        attempts: result.attempts,
      });
      setPool(qs); setIdx(0); setPicked(null);
      if (result.totalQuestions === 0) setError("Question bank contains 0 questions. Please import a question bank.");
      else if (qs.length === 0) setError("No practice questions are available for this selection right now.");
    } catch (e) {
      console.error("[practice] Failed to load questions", e);
      setError("We could not load practice questions right now. Please try again in a moment.");
    }
    finally { setLoading(false); }
  }

  const q = pool[idx % (pool.length || 1)];

  function pick(i: number) {
    if (picked !== null || !q) return;
    setPicked(i);
    setScore((s) => ({ correct: s.correct + (isCorrect(q, i) ? 1 : 0), total: s.total + 1 }));
  }
  function next() {
    if (pool.length === 0) return;
    setPicked(null);
    setIdx((i) => (i + 1) % pool.length);
  }

  async function toggleBookmark() {
    if (!q) return;
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

  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  const accuracy = score.total ? Math.round((score.correct / score.total) * 100) : 0;
  const Icon = q ? (SUBJECT_ICONS[q.subject] ?? Database) : Database;
  const correctIdx = q && q.correct_answer.type === "single" ? q.correct_answer.value : -1;

  return (
    <PageShell>
      <PageHeader
        eyebrow="JEE & NEET Practice"
        title="Rapid practice from the question bank"
        description="Real exam-style questions from the Nexoras curated database. AI provides explanations, not questions."
      />

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 lg:px-8">
        <Link to="/custom-practice" className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 transition-colors hover:border-accent/60">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold">Build a full custom test</p>
              <p className="text-xs text-muted-foreground">Pick chapters, count, difficulty, PYQs & timer. Full CBT + analytics.</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-accent" />
        </Link>

        <div className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${subject === s ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/40 hover:border-accent/40"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${level === l ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/40 hover:border-accent/40"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Time" value={`${min}:${sec}`} icon={Timer} />
          <Stat label="Score" value={`${score.correct}/${score.total}`} icon={CheckCircle2} />
          <Stat label="Accuracy" value={`${accuracy}%`} icon={Sigma} />
        </div>

        {loading && <div className="glass rounded-2xl p-10 text-center text-sm"><Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" /></div>}
        {error && !loading && (
          <div className="glass rounded-2xl p-6 text-sm text-destructive">
            <p>{error}</p>
            {error.includes("0 questions") && <Link to="/admin/questions" className="mt-2 inline-flex text-accent underline">Import Questions</Link>}
          </div>
        )}

        {q && !loading && (
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5">
                  <Icon className="h-3 w-3" /> {q.subject}
                </span>
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">{q.chapter}</span>
                <span className={`rounded-full px-2 py-0.5 ${q.difficulty === "Hard" ? "border border-destructive/40 text-destructive" : q.difficulty === "Medium" ? "border border-accent/40 text-accent" : "border border-border text-muted-foreground"}`}>{q.difficulty}</span>
                {q.is_pyq && q.year && <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-accent">PYQ {q.year}</span>}
              </div>
              <button onClick={toggleBookmark} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:border-accent/40">
                {bookmarks.has(q.id) ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3" />}
                {bookmarks.has(q.id) ? "Saved" : "Save"}
              </button>
            </div>

            <h3 className="mt-4 text-lg font-medium leading-relaxed">{q.question_text}</h3>

            <div className="mt-4 grid gap-2">
              {(q.options ?? []).map((opt, i) => {
                const showState = picked !== null;
                const isC = i === correctIdx;
                const isP = picked === i;
                const cls = !showState
                  ? "border-border bg-background/40 hover:border-accent/40"
                  : isC ? "border-accent/60 bg-accent/10"
                  : isP ? "border-destructive/60 bg-destructive/10"
                  : "border-border bg-background/40 opacity-60";
                return (
                  <button key={i} disabled={picked !== null} onClick={() => pick(i)}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}>
                    <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1">{opt}</span>
                    {showState && isC && <CheckCircle2 className="h-4 w-4 text-accent" />}
                    {showState && isP && !isC && <XCircle className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>

            {picked !== null && (q.explanation || q.solution) && (
              <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
                <p className="font-semibold text-accent">Explanation</p>
                {q.solution && <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{q.solution}</p>}
                {q.explanation && <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button onClick={next} className="bg-gradient-primary text-primary-foreground shadow-glow">
                Next question <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-accent" /> {label}</div>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
