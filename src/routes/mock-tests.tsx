import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { recordAttemptAndAwardXP, type SubjectStat } from "@/lib/gamification";
import { Trophy, Timer, CheckCircle2, XCircle, BarChart3, RotateCcw, Loader2, Flag, Sparkles, BookmarkCheck } from "lucide-react";

export const Route = createFileRoute("/mock-tests")({
  head: () => ({
    meta: [
      { title: "Mock Tests — JEE Main, JEE Adv, BITSAT, MHT CET, EAMCET | Nexoras" },
      { name: "description", content: "Real exam simulator with AI-generated questions, mark-for-review, color-coded palette, negative marking, rank prediction & deep analytics." },
    ],
  }),
  component: MockTestsPage,
});

type Question = {
  subject: string;
  type: "mcq" | "numerical";
  q: string;
  options?: string[];
  correct: number; // index for mcq, value for numerical
  explanation?: string;
};

type ExamSpec = {
  key: string;
  name: string;
  desc: string;
  duration_min: number;
  subjects: { name: string; count: number }[];
  marking: { correct: number; wrong: number };
  difficulty: string;
};

const EXAMS: ExamSpec[] = [
  {
    key: "jee-main",
    name: "JEE Main",
    desc: "75 Qs · 3 hr · +4 / −1 · MCQ + Numerical",
    duration_min: 180,
    subjects: [
      { name: "Physics", count: 25 },
      { name: "Chemistry", count: 25 },
      { name: "Mathematics", count: 25 },
    ],
    marking: { correct: 4, wrong: 1 },
    difficulty: "JEE Main level (mix of easy, medium, hard)",
  },
  {
    key: "jee-adv",
    name: "JEE Advanced",
    desc: "54 Qs · 3 hr · advanced conceptual",
    duration_min: 180,
    subjects: [
      { name: "Physics", count: 18 },
      { name: "Chemistry", count: 18 },
      { name: "Mathematics", count: 18 },
    ],
    marking: { correct: 4, wrong: 1 },
    difficulty: "JEE Advanced level (hard, multi-concept)",
  },
  {
    key: "bitsat",
    name: "BITSAT",
    desc: "60 Qs · 2 hr · speed-focused",
    duration_min: 120,
    subjects: [
      { name: "Physics", count: 20 },
      { name: "Chemistry", count: 20 },
      { name: "Mathematics", count: 20 },
    ],
    marking: { correct: 3, wrong: 1 },
    difficulty: "BITSAT level (medium, speed)",
  },
  {
    key: "mht-cet",
    name: "MHT CET",
    desc: "150 Qs · 3 hr · no negative marking",
    duration_min: 180,
    subjects: [
      { name: "Physics", count: 50 },
      { name: "Chemistry", count: 50 },
      { name: "Mathematics", count: 50 },
    ],
    marking: { correct: 1, wrong: 0 },
    difficulty: "MHT CET level (medium)",
  },
  {
    key: "eamcet",
    name: "EAMCET (AP/TS)",
    desc: "160 Qs · 3 hr · 1 mark each",
    duration_min: 180,
    subjects: [
      { name: "Mathematics", count: 80 },
      { name: "Physics", count: 40 },
      { name: "Chemistry", count: 40 },
    ],
    marking: { correct: 1, wrong: 0 },
    difficulty: "EAMCET level (medium)",
  },
];

type Phase = "select" | "loading" | "running" | "result";

function MockTestsPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("select");
  const [exam, setExam] = useState<ExamSpec>(EXAMS[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [marked, setMarked] = useState<boolean[]>([]);
  const [visited, setVisited] = useState<boolean[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState("");
  const [reward, setReward] = useState<{ earnedXp: number; newBadges: { name: string; description: string }[] } | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) { void finish(); return; }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // chunked AI generation for big tests
  async function generateQuestions(spec: ExamSpec): Promise<Question[]> {
    const total = spec.subjects.reduce((a, s) => a + s.count, 0);
    const CHUNK = 25;
    // Build chunked subject batches preserving subject ratios
    const batches: { name: string; count: number }[][] = [];
    let remaining = spec.subjects.map((s) => ({ ...s }));
    while (remaining.some((s) => s.count > 0)) {
      const batch: { name: string; count: number }[] = [];
      let left = CHUNK;
      for (const s of remaining) {
        if (left <= 0 || s.count <= 0) continue;
        const take = Math.min(s.count, Math.ceil((s.count / remaining.reduce((a, x) => a + x.count, 0)) * CHUNK));
        const real = Math.min(take, left, s.count);
        if (real > 0) {
          batch.push({ name: s.name, count: real });
          s.count -= real;
          left -= real;
        }
      }
      remaining = remaining.filter((s) => s.count > 0).concat(remaining.filter((s) => s.count <= 0).slice(0, 0));
      batches.push(batch);
    }

    const all: Question[] = [];
    for (let i = 0; i < batches.length; i++) {
      setLoadProgress(`Generating questions… (${all.length}/${total})`);
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: spec.name, subjects: batches[i], difficulty: spec.difficulty }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `Failed (${res.status})`);
      }
      const data = (await res.json()) as { questions: Question[] };
      all.push(...data.questions);
    }
    return all.slice(0, total);
  }

  async function start(spec: ExamSpec) {
    setExam(spec);
    setError(null);
    setReward(null);
    setPhase("loading");
    setLoadProgress("Preparing your exam…");
    try {
      const qs = await generateQuestions(spec);
      if (qs.length === 0) throw new Error("No questions returned");
      setQuestions(qs);
      setAnswers(Array(qs.length).fill(null));
      setMarked(Array(qs.length).fill(false));
      setVisited(Array(qs.length).fill(false).map((_, i) => i === 0));
      setCurrent(0);
      setSecondsLeft(spec.duration_min * 60);
      startedAtRef.current = Date.now();
      setPhase("running");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load test";
      setError(msg);
      setPhase("select");
    }
  }

  function pick(value: string) {
    setAnswers((a) => a.map((v, i) => (i === current ? value : v)));
  }

  function navigate(idx: number) {
    setCurrent(idx);
    setVisited((v) => v.map((b, i) => (i === idx ? true : b)));
  }

  function toggleMark() {
    setMarked((m) => m.map((b, i) => (i === current ? !b : b)));
  }

  async function finish() {
    if (phase !== "running") return;
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    let correct = 0, wrong = 0, attempted = 0;
    const subMap = new Map<string, { correct: number; total: number }>();
    questions.forEach((q, i) => {
      const sub = subMap.get(q.subject) ?? { correct: 0, total: 0 };
      sub.total += 1;
      const ans = answers[i];
      if (ans !== null && ans !== "") {
        attempted += 1;
        const isCorrect = q.type === "mcq"
          ? Number(ans) === q.correct
          : Math.abs(parseFloat(ans) - Number(q.correct)) < 0.01;
        if (isCorrect) { correct += 1; sub.correct += 1; }
        else wrong += 1;
      }
      subMap.set(q.subject, sub);
    });
    const score = correct * exam.marking.correct - wrong * exam.marking.wrong;
    const max_score = questions.length * exam.marking.correct;
    const subject_breakdown: SubjectStat[] = Array.from(subMap.entries()).map(([subject, s]) => ({
      subject, correct: s.correct, total: s.total,
    }));

    setPhase("result");

    if (user) {
      try {
        const r = await recordAttemptAndAwardXP(user.id, {
          exam_key: exam.key,
          exam_name: exam.name,
          total_questions: questions.length,
          attempted, correct, wrong, score, max_score,
          duration_seconds: duration,
          subject_breakdown,
        });
        setReward({ earnedXp: r.earnedXp, newBadges: r.newBadges });
      } catch (e) {
        console.error("save attempt failed", e);
      }
    }
  }

  function reset() {
    setPhase("select");
    setQuestions([]);
    setAnswers([]);
    setMarked([]);
    setVisited([]);
    setCurrent(0);
    setError(null);
    setReward(null);
  }

  // Computed result stats
  const stats = useMemo(() => {
    if (phase !== "result") return null;
    let correct = 0, wrong = 0, attempted = 0;
    const subMap = new Map<string, { correct: number; total: number }>();
    questions.forEach((q, i) => {
      const sub = subMap.get(q.subject) ?? { correct: 0, total: 0 };
      sub.total += 1;
      const ans = answers[i];
      if (ans !== null && ans !== "") {
        attempted += 1;
        const isCorrect = q.type === "mcq"
          ? Number(ans) === q.correct
          : Math.abs(parseFloat(ans) - Number(q.correct)) < 0.01;
        if (isCorrect) { correct += 1; sub.correct += 1; }
        else wrong += 1;
      }
      subMap.set(q.subject, sub);
    });
    const score = correct * exam.marking.correct - wrong * exam.marking.wrong;
    const max_score = questions.length * exam.marking.correct;
    const percent = Math.max(0, Math.round((score / Math.max(1, max_score)) * 100));
    const rank = Math.max(1, Math.round((100 - percent) * 1500));
    return { correct, wrong, attempted, skipped: questions.length - attempted, score, max_score, percent, rank, byS: Array.from(subMap.entries()) };
  }, [phase, questions, answers, exam]);

  return (
    <PageShell>
      {phase === "select" && (
        <>
          <PageHeader
            eyebrow="Mock Tests"
            title="Real exam simulator with AI-generated questions"
            description="Production-grade simulation: full question count, color-coded palette, mark-for-review, negative marking, and AI analytics."
          />
          <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {!user && (
              <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
                💡 Sign in to save your attempts, earn XP, and unlock achievements.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {EXAMS.map((e) => {
                const total = e.subjects.reduce((a, s) => a + s.count, 0);
                return (
                  <div key={e.key} className="glass rounded-2xl p-6">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                      <Trophy className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold">{e.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.subjects.map((s) => (
                        <span key={s.name} className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.name} · {s.count}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground">Total: {total} questions · {e.duration_min} min</p>
                    <Button onClick={() => start(e)} className="mt-4 w-full bg-gradient-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" /> Start AI mock test
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {phase === "loading" && (
        <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <h2 className="mt-6 font-display text-xl font-semibold">{exam.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadProgress}</p>
          <p className="mt-1 text-xs text-muted-foreground">AI is generating exam-quality questions across {exam.subjects.length} subjects. This may take 20–60s.</p>
        </section>
      )}

      {phase === "running" && questions.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <div className="glass mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm">
            <div>
              <span className="text-muted-foreground">{exam.name}</span> · Q {current + 1} of {questions.length}
              <span className="ml-3 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                {questions[current].subject}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-accent" />
              <span className={`font-mono ${secondsLeft < 60 ? "text-destructive" : ""}`}>
                {Math.floor(secondsLeft / 3600).toString().padStart(2, "0")}:
                {Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0")}:
                {(secondsLeft % 60).toString().padStart(2, "0")}
              </span>
              <Button onClick={() => void finish()} size="sm" variant="outline">Submit</Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="glass rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-accent">{questions[current].type === "numerical" ? "Numerical" : "Multiple Choice"}</p>
              <h3 className="mt-2 whitespace-pre-wrap text-base font-medium leading-relaxed">{questions[current].q}</h3>

              <div className="mt-5">
                {questions[current].type === "mcq" && questions[current].options ? (
                  <div className="grid gap-2">
                    {questions[current].options!.map((opt, i) => {
                      const picked = answers[current] === String(i);
                      return (
                        <button key={i} onClick={() => pick(String(i))}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                            picked ? "border-accent/60 bg-accent/10" : "border-border bg-background/40 hover:border-accent/40"
                          }`}>
                          <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground">Enter numerical answer</label>
                    <input
                      type="number"
                      step="any"
                      value={answers[current] ?? ""}
                      onChange={(e) => pick(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-sm focus:border-accent/60 focus:outline-none"
                      placeholder="e.g. 3.14"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" disabled={current === 0} onClick={() => navigate(current - 1)}>Previous</Button>
                <Button variant="outline" onClick={toggleMark}>
                  <Flag className="h-4 w-4" /> {marked[current] ? "Unmark" : "Mark for review"}
                </Button>
                <Button variant="outline" onClick={() => pick("")}>Clear</Button>
                <div className="ml-auto" />
                {current < questions.length - 1 ? (
                  <Button onClick={() => navigate(current + 1)} className="bg-gradient-primary text-primary-foreground">
                    Save & Next
                  </Button>
                ) : (
                  <Button onClick={() => void finish()} className="bg-gradient-primary text-primary-foreground">
                    Submit Test
                  </Button>
                )}
              </div>
            </div>

            <aside className="glass rounded-2xl p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Palette</h4>
              <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
                {questions.map((_, i) => {
                  const ans = answers[i];
                  const isAnswered = ans !== null && ans !== "";
                  const isMarked = marked[i];
                  const isVisited = visited[i];
                  const isCurrent = i === current;
                  const cls = isCurrent
                    ? "bg-gradient-primary text-primary-foreground ring-2 ring-accent"
                    : isMarked && isAnswered
                      ? "bg-purple-500/30 text-purple-200 border border-purple-400/60"
                      : isMarked
                        ? "bg-purple-500/15 text-purple-300 border border-purple-400/40"
                        : isAnswered
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/50"
                          : isVisited
                            ? "bg-rose-500/15 text-rose-300 border border-rose-400/30"
                            : "bg-background/40 text-muted-foreground border border-border";
                  return (
                    <button key={i} onClick={() => navigate(i)}
                      className={`grid h-8 w-8 place-items-center rounded text-xs font-medium ${cls}`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 text-[11px]">
                <Legend color="bg-emerald-500/40 border-emerald-400/60" label="Answered" />
                <Legend color="bg-rose-500/30 border-rose-400/40" label="Visited, not answered" />
                <Legend color="bg-purple-500/30 border-purple-400/60" label="Marked for review" />
                <Legend color="bg-background/40 border-border" label="Not visited" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <Stat label="Answered" value={answers.filter((a) => a !== null && a !== "").length} />
                <Stat label="Marked" value={marked.filter(Boolean).length} />
              </div>
            </aside>
          </div>
        </section>
      )}

      {phase === "result" && stats && (
        <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 lg:px-8">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{exam.name} · Result</p>
            <p className="mt-2 font-display text-5xl font-bold text-gradient">{stats.score}</p>
            <p className="text-sm text-muted-foreground">out of {stats.max_score} marks · {stats.percent}%</p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs">
              <Trophy className="h-3 w-3 text-accent" /> Predicted rank: ~{stats.rank.toLocaleString()}
            </p>
          </div>

          {reward && (
            <div className="glass rounded-2xl border border-accent/40 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <p className="font-display text-sm font-semibold">+{reward.earnedXp} XP earned</p>
              </div>
              {reward.newBadges.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">New badges unlocked</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reward.newBadges.map((b) => (
                      <span key={b.name} className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-xs text-primary-foreground">
                        <BookmarkCheck className="h-3 w-3" /> {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Tile icon={CheckCircle2} label="Correct" value={String(stats.correct)} />
            <Tile icon={XCircle} label="Wrong" value={String(stats.wrong)} />
            <Tile icon={BarChart3} label="Skipped" value={String(stats.skipped)} />
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Subject-wise breakdown</h3>
            <div className="mt-3 space-y-3">
              {stats.byS.map(([sub, s]) => {
                const pct = Math.round((s.correct / Math.max(1, s.total)) * 100);
                return (
                  <div key={sub}>
                    <div className="flex justify-between text-sm">
                      <span>{sub}</span>
                      <span className="text-muted-foreground">{s.correct}/{s.total} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                      <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              💡 Focus your next 7 days on the lowest-scoring subject above.
            </p>
          </div>

          <details className="glass rounded-2xl p-6">
            <summary className="cursor-pointer text-sm font-medium">Review answers & explanations</summary>
            <div className="mt-4 space-y-4">
              {questions.map((q, i) => {
                const ans = answers[i];
                const isCorrect = ans !== null && ans !== "" && (q.type === "mcq"
                  ? Number(ans) === q.correct
                  : Math.abs(parseFloat(ans) - Number(q.correct)) < 0.01);
                return (
                  <div key={i} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-muted-foreground">Q{i + 1}.</span>
                      <span className="flex-1">{q.q}</span>
                      <span className={`text-xs ${isCorrect ? "text-emerald-400" : ans ? "text-rose-400" : "text-muted-foreground"}`}>
                        {isCorrect ? "✓" : ans ? "✗" : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Correct: {q.type === "mcq" && q.options ? q.options[q.correct as number] : String(q.correct)}
                      {q.explanation && <> · {q.explanation}</>}
                    </p>
                  </div>
                );
              })}
            </div>
          </details>

          <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4" /> Take another test
          </Button>
        </section>
      )}
    </PageShell>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-accent" />
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={`inline-block h-3 w-3 rounded border ${color}`} />
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
