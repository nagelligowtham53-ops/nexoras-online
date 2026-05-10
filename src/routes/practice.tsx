import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Atom, FlaskConical, Sigma, CheckCircle2, XCircle, Timer, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "JEE Practice Questions — Nexoras" },
      { name: "description", content: "Topic-wise JEE practice questions in Physics, Chemistry & Mathematics with detailed explanations and progress tracking." },
    ],
  }),
  component: PracticePage,
});

type Q = {
  subject: "Physics" | "Chemistry" | "Mathematics";
  topic: string;
  level: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  correct: number; // index
  explanation: string;
};

const BANK: Q[] = [
  // PHYSICS
  { subject: "Physics", topic: "Kinematics", level: "Easy",
    question: "A body starts from rest with acceleration 2 m/s². Distance covered in 5 s is:",
    options: ["10 m", "25 m", "50 m", "100 m"], correct: 1,
    explanation: "s = ut + ½at² = 0 + ½·2·25 = 25 m." },
  { subject: "Physics", topic: "Mechanics", level: "Medium",
    question: "Two blocks of 2 kg and 3 kg connected by a string on smooth surface, pulled with 10 N. Tension is:",
    options: ["2 N", "4 N", "6 N", "8 N"], correct: 1,
    explanation: "a = 10/(2+3) = 2 m/s². Tension on 2 kg = 2·2 = 4 N." },
  { subject: "Physics", topic: "Modern", level: "Hard",
    question: "de Broglie wavelength of an electron accelerated through 150 V is approximately:",
    options: ["0.1 Å", "1 Å", "10 Å", "100 Å"], correct: 1,
    explanation: "λ = 12.27/√V Å = 12.27/√150 ≈ 1 Å." },
  { subject: "Physics", topic: "Electromagnetism", level: "Medium",
    question: "Magnetic field at the center of a circular loop of radius R carrying current I is:",
    options: ["μ₀I/(2R)", "μ₀I/(4πR)", "μ₀I/R", "2μ₀I/R"], correct: 0,
    explanation: "Standard result: B = μ₀I/(2R)." },

  // CHEMISTRY
  { subject: "Chemistry", topic: "Organic", level: "Easy",
    question: "Which is the strongest acid?",
    options: ["Methanol", "Phenol", "Ethanol", "Water"], correct: 1,
    explanation: "Phenol is acidic due to resonance stabilisation of the phenoxide ion." },
  { subject: "Chemistry", topic: "Physical", level: "Medium",
    question: "pH of 0.001 M HCl is:",
    options: ["1", "2", "3", "4"], correct: 2,
    explanation: "pH = -log(0.001) = 3." },
  { subject: "Chemistry", topic: "Inorganic", level: "Hard",
    question: "Which has the highest lattice energy?",
    options: ["NaCl", "MgO", "KCl", "CsCl"], correct: 1,
    explanation: "MgO has +2 and -2 charges → highest lattice energy among these." },
  { subject: "Chemistry", topic: "Organic", level: "Medium",
    question: "SN1 reaction is favoured by:",
    options: ["Strong nucleophile", "Polar protic solvent", "Primary substrate", "Aprotic solvent"], correct: 1,
    explanation: "SN1 forms a carbocation; polar protic solvents stabilise it." },

  // MATH
  { subject: "Mathematics", topic: "Calculus", level: "Easy",
    question: "d/dx (sin x · cos x) =",
    options: ["cos 2x", "sin 2x", "2 sin x", "−sin 2x"], correct: 0,
    explanation: "sin x · cos x = ½ sin 2x → derivative = cos 2x." },
  { subject: "Mathematics", topic: "Algebra", level: "Medium",
    question: "If roots of x² − 5x + k = 0 are equal, then k =",
    options: ["25/4", "5/2", "5", "10"], correct: 0,
    explanation: "Discriminant = 0 → 25 − 4k = 0 → k = 25/4." },
  { subject: "Mathematics", topic: "Coordinate", level: "Medium",
    question: "Distance between (1,2) and (4,6) is:",
    options: ["3", "4", "5", "7"], correct: 2,
    explanation: "√((4−1)² + (6−2)²) = √(9+16) = 5." },
  { subject: "Mathematics", topic: "Calculus", level: "Hard",
    question: "∫ from 0 to π/2 of sin²x dx =",
    options: ["π/2", "π/4", "1", "π"], correct: 1,
    explanation: "Using sin²x = (1−cos 2x)/2 → integral = π/4." },
];

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics"] as const;
const LEVELS = ["All", "Easy", "Medium", "Hard"] as const;

const ICONS = { Physics: Atom, Chemistry: FlaskConical, Mathematics: Sigma } as const;

function PracticePage() {
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("All");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [seconds, setSeconds] = useState(0);

  const filtered = useMemo(() => {
    return BANK.filter((q) => (subject === "All" || q.subject === subject) && (level === "All" || q.level === level));
  }, [subject, level]);

  const q = filtered[idx % filtered.length];

  useEffect(() => { setIdx(0); setPicked(null); }, [subject, level]);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setScore((s) => ({ correct: s.correct + (i === q.correct ? 1 : 0), total: s.total + 1 }));
  }
  function next() {
    setPicked(null);
    setIdx((i) => (i + 1) % filtered.length);
  }

  if (!q) {
    return (
      <PageShell>
        <PageHeader eyebrow="Practice" title="No questions match" description="Try a different filter." />
      </PageShell>
    );
  }

  const Icon = ICONS[q.subject];
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  const accuracy = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow="JEE Practice"
        title="Topic-wise practice questions"
        description="Physics · Chemistry · Mathematics. Instant explanations. Track your accuracy in real time."
      />

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 lg:px-8">
        {/* Filters */}
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

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Time" value={`${min}:${sec}`} icon={Timer} />
          <Stat label="Score" value={`${score.correct}/${score.total}`} icon={CheckCircle2} />
          <Stat label="Accuracy" value={`${accuracy}%`} icon={Sigma} />
        </div>

        {/* Question */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5">
              <Icon className="h-3 w-3" /> {q.subject}
            </span>
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">{q.topic}</span>
            <span className={`rounded-full px-2 py-0.5 ${q.level === "Hard" ? "border border-destructive/40 text-destructive" : q.level === "Medium" ? "border border-accent/40 text-accent" : "border border-border text-muted-foreground"}`}>{q.level}</span>
          </div>

          <h3 className="mt-4 text-lg font-medium leading-relaxed">{q.question}</h3>

          <div className="mt-4 grid gap-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isPicked = picked === i;
              const showState = picked !== null;
              const cls = !showState
                ? "border-border bg-background/40 hover:border-accent/40"
                : isCorrect
                  ? "border-accent/60 bg-accent/10"
                  : isPicked
                    ? "border-destructive/60 bg-destructive/10"
                    : "border-border bg-background/40 opacity-60";
              return (
                <button key={i} disabled={picked !== null} onClick={() => pick(i)}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}>
                  <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                  <span className="flex-1">{opt}</span>
                  {showState && isCorrect && <CheckCircle2 className="h-4 w-4 text-accent" />}
                  {showState && isPicked && !isCorrect && <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
              <p className="font-semibold text-accent">Explanation</p>
              <p className="mt-1 text-muted-foreground">{q.explanation}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={next} className="bg-gradient-primary text-primary-foreground shadow-glow">
              Next question <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
