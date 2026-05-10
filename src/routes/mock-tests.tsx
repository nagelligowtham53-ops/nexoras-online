import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Trophy, Timer, CheckCircle2, XCircle, BarChart3, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/mock-tests")({
  head: () => ({
    meta: [
      { title: "Mock Tests — JEE, BITSAT, EAMCET & more | Nexoras" },
      { name: "description", content: "AI-powered mock tests for JEE Main, JEE Advanced, MHT CET, BITSAT, EAMCET. Real exam interface, timer, negative marking & analytics." },
    ],
  }),
  component: MockTestsPage,
});

type TestQ = { q: string; options: string[]; correct: number; subject: "Physics" | "Chemistry" | "Mathematics" };

const EXAMS = [
  { key: "jee-main", name: "JEE Main", desc: "75 questions · 3 hours · +4/-1", duration: 60, count: 5 },
  { key: "jee-adv", name: "JEE Advanced", desc: "Multi-correct · partial marks", duration: 60, count: 5 },
  { key: "bitsat", name: "BITSAT", desc: "150 Qs · 3 hr · adaptive", duration: 45, count: 5 },
  { key: "mht-cet", name: "MHT CET", desc: "150 Qs · 3 hr · no negative", duration: 45, count: 5 },
  { key: "eamcet", name: "EAMCET (AP/TS)", desc: "160 Qs · 3 hr · 1 mark each", duration: 45, count: 5 },
];

const QS: TestQ[] = [
  { q: "Acceleration due to gravity at the center of Earth is:", options: ["9.8 m/s²", "Zero", "Infinity", "4.9 m/s²"], correct: 1, subject: "Physics" },
  { q: "SI unit of electric flux is:", options: ["V·m", "N/C", "C/m²", "N·m"], correct: 0, subject: "Physics" },
  { q: "Number of moles in 22 g of CO₂ is:", options: ["0.25", "0.5", "1", "2"], correct: 1, subject: "Chemistry" },
  { q: "IUPAC name of CH₃-CO-CH₃ is:", options: ["Propanal", "Propan-2-one", "Ethanal", "Methanal"], correct: 1, subject: "Chemistry" },
  { q: "If sin θ = 3/5, then cos θ =", options: ["3/5", "4/5", "5/4", "5/3"], correct: 1, subject: "Mathematics" },
];

type Phase = "select" | "running" | "result";

function MockTestsPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [exam, setExam] = useState(EXAMS[0]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const test = useMemo(() => QS.slice(0, exam.count), [exam]);

  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) { finish(); return; }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, secondsLeft]);

  function start(e: typeof EXAMS[number]) {
    setExam(e);
    setAnswers(Array(e.count).fill(null));
    setCurrent(0);
    setSecondsLeft(e.duration);
    setPhase("running");
  }
  function pick(i: number) {
    setAnswers((a) => a.map((v, idx) => (idx === current ? i : v)));
  }
  function finish() {
    setPhase("result");
  }
  function reset() {
    setPhase("select");
    setAnswers([]);
    setCurrent(0);
  }

  const correctCount = answers.filter((a, i) => a !== null && a === test[i]?.correct).length;
  const wrongCount = answers.filter((a, i) => a !== null && a !== test[i]?.correct).length;
  const skipped = answers.filter((a) => a === null).length;
  const score = correctCount * 4 - wrongCount * 1;
  const maxScore = test.length * 4;
  const percent = Math.max(0, Math.round((score / maxScore) * 100));
  const rank = Math.max(1, Math.round((100 - percent) * 1500));

  // subject-wise breakdown
  const bySubject = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    test.forEach((q, i) => {
      const s = map.get(q.subject) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (answers[i] === q.correct) s.correct += 1;
      map.set(q.subject, s);
    });
    return Array.from(map.entries());
  }, [test, answers]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Mock Tests"
        title="Real exam environment, AI-powered analysis"
        description="Practice JEE, BITSAT, MHT CET, EAMCET in a realistic interface. Get instant rank prediction and weak-topic insights."
      />

      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        {phase === "select" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EXAMS.map((e) => (
              <div key={e.key} className="glass rounded-2xl p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{e.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                <Button onClick={() => start(e)} className="mt-4 w-full bg-gradient-primary text-primary-foreground">
                  Start mock test
                </Button>
              </div>
            ))}
          </div>
        )}

        {phase === "running" && (
          <div className="space-y-4">
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
              <div className="text-sm">
                <span className="text-muted-foreground">{exam.name}</span> · Q {current + 1} of {test.length}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-accent" />
                <span className={`font-mono ${secondsLeft < 10 ? "text-destructive" : ""}`}>
                  {Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}
                </span>
                <Button onClick={finish} size="sm" variant="outline">Submit</Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-accent">{test[current].subject}</p>
              <h3 className="mt-2 text-lg font-medium leading-relaxed">{test[current].q}</h3>
              <div className="mt-5 grid gap-2">
                {test[current].options.map((opt, i) => {
                  const picked = answers[current] === i;
                  return (
                    <button key={i} onClick={() => pick(i)}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                        picked ? "border-accent/60 bg-accent/10" : "border-border bg-background/40 hover:border-accent/40"
                      }`}>
                      <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>Previous</Button>
                {current < test.length - 1 ? (
                  <Button onClick={() => setCurrent((c) => c + 1)} className="bg-gradient-primary text-primary-foreground">Next</Button>
                ) : (
                  <Button onClick={finish} className="bg-gradient-primary text-primary-foreground">Submit Test</Button>
                )}
              </div>
            </div>

            <div className="glass rounded-xl p-3">
              <div className="flex flex-wrap gap-2">
                {test.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`grid h-8 w-8 place-items-center rounded text-xs ${
                      i === current ? "bg-gradient-primary text-primary-foreground" :
                      answers[i] !== null ? "bg-accent/20 border border-accent/40" :
                      "bg-background/40 border border-border"
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{exam.name} · Result</p>
              <p className="mt-2 font-display text-5xl font-bold text-gradient">{score}</p>
              <p className="text-sm text-muted-foreground">out of {maxScore} marks · {percent}%</p>
              <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs">
                <Trophy className="h-3 w-3 text-accent" /> Predicted rank: ~{rank.toLocaleString()}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Tile icon={CheckCircle2} label="Correct" value={String(correctCount)} />
              <Tile icon={XCircle} label="Wrong" value={String(wrongCount)} />
              <Tile icon={BarChart3} label="Skipped" value={String(skipped)} />
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold">Subject-wise breakdown</h3>
              <div className="mt-3 space-y-2">
                {bySubject.map(([sub, s]) => {
                  const pct = Math.round((s.correct / s.total) * 100);
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

            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4" /> Take another test
            </Button>
          </div>
        )}
      </section>
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
