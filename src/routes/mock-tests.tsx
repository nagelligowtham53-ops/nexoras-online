import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { recordAttemptAndAwardXP, type SubjectStat } from "@/lib/gamification";
import { ensureQuestionBankSeeded } from "@/lib/question-bank.functions";
import { fetchQuestions, type DbQuestion, type Difficulty as DbDifficulty } from "@/lib/questions";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy, Timer, CheckCircle2, XCircle, BarChart3, RotateCcw, Loader2, Flag, Sparkles,
  BookmarkCheck, Maximize2, Minimize2, ChevronLeft, ChevronRight, ListChecks, AlertTriangle,
  Brain, User as UserIcon, ShieldCheck, Menu,
} from "lucide-react";


export const Route = createFileRoute("/mock-tests")({
  head: () => ({
    meta: [
      { title: "JEE Main CBT Simulator — Real Mock Tests | Nexoras" },
      { name: "description", content: "Production-grade JEE Main / Advanced / BITSAT / MHT CET / EAMCET CBT simulator: full-screen mode, NTA-style palette, sections, negative marking, rank prediction & AI analytics." },
    ],
  }),
  component: () => (
    <PremiumGate feature="Mock Tests">
      <MockTestsPage />
    </PremiumGate>
  ),
});

type Question = {
  subject: string;
  type: "mcq" | "numerical";
  q: string;
  options?: string[];
  correct: number;
  explanation?: string;
};

type ExamSpec = {
  key: string;
  name: string;
  short: string;
  desc: string;
  duration_min: number;
  subjects: { name: string; count: number }[];
  marking: { correct: number; wrong: number };
  difficulty: string;
  pattern: string;
};

const EXAMS: ExamSpec[] = [
  { key: "jee-main", name: "JEE Main", short: "Main", pattern: "NTA CBT · MCQ + Integer",
    desc: "75 Qs · 3 hr · +4 / −1", duration_min: 180,
    subjects: [{ name: "Physics", count: 25 }, { name: "Chemistry", count: 25 }, { name: "Mathematics", count: 25 }],
    marking: { correct: 4, wrong: 1 }, difficulty: "JEE Main level (easy, medium, hard mix)" },
  { key: "jee-adv", name: "JEE Advanced", short: "Advanced", pattern: "Multi-concept, high difficulty",
    desc: "54 Qs · 3 hr · +4 / −1", duration_min: 180,
    subjects: [{ name: "Physics", count: 18 }, { name: "Chemistry", count: 18 }, { name: "Mathematics", count: 18 }],
    marking: { correct: 4, wrong: 1 }, difficulty: "JEE Advanced (hard, multi-concept)" },
  { key: "neet", name: "NEET UG", short: "NEET", pattern: "NTA CBT · Bio-heavy",
    desc: "180 Qs · 3 hr 20 min · +4 / −1", duration_min: 200,
    subjects: [{ name: "Botany", count: 45 }, { name: "Zoology", count: 45 }, { name: "Physics", count: 45 }, { name: "Chemistry", count: 45 }],
    marking: { correct: 4, wrong: 1 }, difficulty: "NEET UG (NCERT-heavy)" },
  { key: "bitsat", name: "BITSAT", short: "BITSAT", pattern: "Speed-focused MCQ",
    desc: "60 Qs · 2 hr · +3 / −1", duration_min: 120,
    subjects: [{ name: "Physics", count: 20 }, { name: "Chemistry", count: 20 }, { name: "Mathematics", count: 20 }],
    marking: { correct: 3, wrong: 1 }, difficulty: "BITSAT level (medium, speed)" },
  { key: "mht-cet", name: "MHT CET", short: "MHT CET", pattern: "No negative marking",
    desc: "150 Qs · 3 hr · +1 / 0", duration_min: 180,
    subjects: [{ name: "Physics", count: 50 }, { name: "Chemistry", count: 50 }, { name: "Mathematics", count: 50 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "MHT CET level (medium)" },
  { key: "comedk", name: "COMEDK UGET", short: "COMEDK", pattern: "Karnataka CBT · MCQ only",
    desc: "180 Qs · 3 hr · +1 / 0", duration_min: 180,
    subjects: [{ name: "Physics", count: 60 }, { name: "Chemistry", count: 60 }, { name: "Mathematics", count: 60 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "COMEDK UGET level (Karnataka 11-12 PCM, medium, speed-focused)" },
  { key: "eamcet", name: "EAMCET (AP/TS)", short: "EAMCET", pattern: "Maths-heavy CBT",
    desc: "160 Qs · 3 hr · +1 / 0", duration_min: 180,
    subjects: [{ name: "Mathematics", count: 80 }, { name: "Physics", count: 40 }, { name: "Chemistry", count: 40 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "EAMCET level (medium)" },
  { key: "upsc", name: "UPSC CSE Prelims", short: "UPSC", pattern: "GS Paper-I objective",
    desc: "60 Qs · 2 hr · +2 / −0.66", duration_min: 120,
    subjects: [{ name: "History & Polity", count: 15 }, { name: "Geography & Environment", count: 15 }, { name: "Economy & Current Affairs", count: 15 }, { name: "Science & Tech", count: 15 }],
    marking: { correct: 2, wrong: 1 }, difficulty: "UPSC Prelims (analytical, factual)" },
  { key: "cat", name: "CAT (IIM)", short: "CAT", pattern: "VARC · DILR · QA",
    desc: "66 Qs · 2 hr · +3 / −1", duration_min: 120,
    subjects: [{ name: "Verbal Ability & Reading Comprehension", count: 22 }, { name: "Data Interpretation & Logical Reasoning", count: 22 }, { name: "Quantitative Aptitude", count: 22 }],
    marking: { correct: 3, wrong: 1 }, difficulty: "CAT level (high difficulty, time-pressured)" },
  { key: "gate", name: "GATE (CSE)", short: "GATE", pattern: "Core + Aptitude + Maths",
    desc: "65 Qs · 3 hr · +1/+2 / −1/3", duration_min: 180,
    subjects: [{ name: "General Aptitude", count: 10 }, { name: "Engineering Mathematics", count: 13 }, { name: "Computer Science Core", count: 42 }],
    marking: { correct: 2, wrong: 1 }, difficulty: "GATE CSE (conceptual, deep)" },
  { key: "ca", name: "CA Foundation", short: "CA", pattern: "ICAI objective + descriptive",
    desc: "100 Qs · 3 hr · +1 / −0.25", duration_min: 180,
    subjects: [{ name: "Accounting", count: 30 }, { name: "Business Laws", count: 25 }, { name: "Quantitative Aptitude", count: 25 }, { name: "Business Economics", count: 20 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "CA Foundation (conceptual)" },
  { key: "cfa", name: "CFA Level I", short: "CFA", pattern: "180 MCQs · two sessions",
    desc: "90 Qs · 2 hr 15 min · +1 / 0", duration_min: 135,
    subjects: [{ name: "Ethics & Quant Methods", count: 25 }, { name: "Economics & Financial Reporting", count: 25 }, { name: "Equity & Fixed Income", count: 25 }, { name: "Derivatives & Portfolio Mgmt", count: 15 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "CFA Level I (concept + application)" },
  { key: "usmle", name: "USMLE Step 1", short: "USMLE", pattern: "Clinical vignettes",
    desc: "80 Qs · 2 hr · +1 / 0", duration_min: 120,
    subjects: [{ name: "Anatomy & Physiology", count: 20 }, { name: "Pathology & Pharmacology", count: 25 }, { name: "Microbiology & Immunology", count: 20 }, { name: "Behavioral & Biochemistry", count: 15 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "USMLE Step 1 (clinical reasoning)" },
  { key: "sat", name: "SAT", short: "SAT", pattern: "Digital adaptive",
    desc: "80 Qs · 2 hr 14 min · +1 / 0", duration_min: 134,
    subjects: [{ name: "Reading & Writing", count: 40 }, { name: "Math", count: 40 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "SAT digital (medium-hard adaptive)" },
  { key: "gre", name: "GRE General", short: "GRE", pattern: "Verbal · Quant · AW",
    desc: "54 Qs · 1 hr 58 min · +1 / 0", duration_min: 118,
    subjects: [{ name: "Verbal Reasoning", count: 27 }, { name: "Quantitative Reasoning", count: 27 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "GRE level (advanced vocabulary, quant)" },
  { key: "ielts", name: "IELTS Academic", short: "IELTS", pattern: "Listening · Reading · Writing · Speaking",
    desc: "60 Qs · 2 hr · +1 / 0", duration_min: 120,
    subjects: [{ name: "Listening", count: 20 }, { name: "Reading", count: 20 }, { name: "Writing & Grammar", count: 20 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "IELTS Academic (band 6.5–8)" },
  { key: "toefl", name: "TOEFL iBT", short: "TOEFL", pattern: "Academic English",
    desc: "60 Qs · 2 hr · +1 / 0", duration_min: 120,
    subjects: [{ name: "Reading", count: 20 }, { name: "Listening", count: 20 }, { name: "Structure & Vocabulary", count: 20 }],
    marking: { correct: 1, wrong: 0 }, difficulty: "TOEFL iBT (university-level English)" },
  { key: "imo", name: "IMO / Math Olympiad", short: "Olympiad", pattern: "Proof + problem-solving",
    desc: "30 Qs · 2 hr · +3 / 0", duration_min: 120,
    subjects: [{ name: "Algebra", count: 8 }, { name: "Number Theory", count: 8 }, { name: "Combinatorics", count: 7 }, { name: "Geometry", count: 7 }],
    marking: { correct: 3, wrong: 0 }, difficulty: "Olympiad (hard, non-routine)" },
  { key: "coding", name: "Coding Contest", short: "Coding", pattern: "DSA + algorithms MCQ",
    desc: "30 Qs · 90 min · +3 / −1", duration_min: 90,
    subjects: [{ name: "Data Structures", count: 10 }, { name: "Algorithms", count: 10 }, { name: "Problem Solving & Complexity", count: 10 }],
    marking: { correct: 3, wrong: 1 }, difficulty: "Competitive programming (medium-hard)" },
  { key: "icpc", name: "ICPC Prep", short: "ICPC", pattern: "Team-style algorithmic",
    desc: "25 Qs · 2 hr · +4 / 0", duration_min: 120,
    subjects: [{ name: "Graphs & Trees", count: 8 }, { name: "Dynamic Programming", count: 8 }, { name: "Math & Number Theory", count: 5 }, { name: "Greedy & Ad-hoc", count: 4 }],
    marking: { correct: 4, wrong: 0 }, difficulty: "ICPC regional level (hard)" },
];

type TestType = "full" | "chapter";
type Difficulty = "mixed" | "easy" | "medium" | "hard";
type Phase = "select" | "instructions" | "loading" | "running" | "summary" | "result";

function MockTestsPage() {
  const ensureSeed = useServerFn(ensureQuestionBankSeeded);
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("select");
  const [exam, setExam] = useState<ExamSpec>(EXAMS[0]);
  const [testType, setTestType] = useState<TestType>("full");
  const [chapterSubject, setChapterSubject] = useState<string>(EXAMS[0].subjects[0].name);
  useEffect(() => {
    if (!exam.subjects.some((s) => s.name === chapterSubject)) {
      setChapterSubject(exam.subjects[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.key]);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [agreed, setAgreed] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [marked, setMarked] = useState<boolean[]>([]);
  const [visited, setVisited] = useState<boolean[]>([]);
  const [timePerQ, setTimePerQ] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState("");
  const [reward, setReward] = useState<{ earnedXp: number; newBadges: { name: string; description: string }[] } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const startedAtRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const examRootRef = useRef<HTMLDivElement>(null);

  // ---- Timer
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) { void finish(true); return; }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // ---- Time-per-question tracking
  useEffect(() => {
    if (phase !== "running") return;
    lastTickRef.current = Date.now();
    const ic = current;
    return () => {
      const dt = Math.round((Date.now() - lastTickRef.current) / 1000);
      setTimePerQ((arr) => arr.map((v, i) => (i === ic ? v + dt : v)));
    };
  }, [current, phase]);

  // ---- Fullscreen sync
  useEffect(() => {
    function onChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function enterFullscreen() {
    const el = examRootRef.current ?? document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }
  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  // ---- DB-backed question loading (real question bank)
  const EXAM_DB_MAP: Record<string, string | null> = {
    "JEE Main": "JEE Main",
    "JEE Advanced": "JEE Advanced",
    "NEET UG": "NEET",
    "BITSAT": "BITSAT",
    "MHT CET": "MHT CET",
    "COMEDK UGET": "COMEDK UGET",
    "EAMCET (AP/TS)": "EAMCET (AP/TS)",
    "UPSC CSE Prelims": "UPSC CSE Prelims",
    "CAT (IIM)": "CAT (IIM)",
    "GATE (CSE)": "GATE (CSE)",
    "CA Foundation": "CA Foundation",
    "CFA Level I": "CFA Level I",
    "USMLE Step 1": "USMLE Step 1",
    "SAT": "SAT",
    "GRE General": "GRE General",
    "IELTS Academic": "IELTS Academic",
    "TOEFL iBT": "TOEFL iBT",
    "IMO / Math Olympiad": "IMO / Math Olympiad",
    "Coding Contest": "Coding Contest",
    "ICPC Prep": "ICPC Prep",
  };
  function dbSubjectFor(examKey: string, subjectName: string): string {
    if (examKey === "neet" && (subjectName === "Botany" || subjectName === "Zoology")) return "Biology";
    return subjectName;
  }
  function difficultyFilter(): DbDifficulty[] | undefined {
    if (difficulty === "mixed") return undefined;
    if (difficulty === "easy") return ["Easy"];
    if (difficulty === "medium") return ["Medium"];
    return ["Hard"];
  }
  function mapDbToQuestion(r: DbQuestion, displaySubject: string): Question | null {
    if (r.question_type === "single_correct" && r.options && r.correct_answer.type === "single") {
      return {
        subject: displaySubject, type: "mcq", q: r.question_text,
        options: r.options, correct: r.correct_answer.value,
        explanation: r.solution ?? r.explanation ?? undefined,
      };
    }
    if ((r.question_type === "integer" || r.question_type === "numerical") && r.correct_answer.type === "numeric") {
      return {
        subject: displaySubject, type: "numerical", q: r.question_text,
        correct: r.correct_answer.value,
        explanation: r.solution ?? r.explanation ?? undefined,
      };
    }
    return null;
  }

  async function loadQuestions(spec: ExamSpec): Promise<Question[]> {
    await ensureSeed();
    const dbExam = EXAM_DB_MAP[spec.name];
    if (!dbExam) throw new Error("This exam is not linked to the question bank yet.");
    const effective: { name: string; count: number }[] =
      testType === "chapter"
        ? [{ name: chapterSubject, count: 25 }]
        : spec.subjects.map((s) => ({ ...s }));
    const total = effective.reduce((a, s) => a + s.count, 0);
    const diffs = difficultyFilter();
    const all: Question[] = [];
    try {
      for (const s of effective) {
        setLoadProgress(`Loading ${s.name} questions… (${all.length}/${total})`);
        const rows = await fetchQuestions({
          exams: [dbExam],
          subjects: [dbSubjectFor(spec.key, s.name)],
          difficulties: diffs,
          count: s.count,
        });
        for (const r of rows) {
          const mapped = mapDbToQuestion(r, s.name);
          if (mapped) all.push(mapped);
        }
      }
    } catch (e) {
      console.error("[mock-tests] DB fetch failed", e);
    }
    if (all.length === 0) throw new Error("No real questions matched this mock test after seeding.");
    return all;
  }


  // ---- Availability probe (so we can disable the Begin button ahead of time)
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  async function probeAvailability(spec: ExamSpec) {
    const dbExam = EXAM_DB_MAP[spec.name];
    if (!dbExam) { setAvailableCount(0); return; }
    setCheckingAvailability(true);
    try {
      await ensureSeed();
      const subjects = testType === "chapter"
        ? [dbSubjectFor(spec.key, chapterSubject)]
        : spec.subjects.map((s) => dbSubjectFor(spec.key, s.name));
      let q = supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .overlaps("exams", [dbExam])
        .in("subject", subjects);
      const diffs = difficultyFilter();
      if (diffs) q = q.in("difficulty", diffs);
      const { count, error } = await q;
      if (error) throw error;
      setAvailableCount(count ?? 0);
    } catch (error) {
      console.error("[mock-tests] Availability check failed", error);
      setAvailableCount(0);
    } finally {
      setCheckingAvailability(false);
    }
  }
  useEffect(() => {
    if (phase !== "instructions") return;
    void probeAvailability(exam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exam.key, testType, chapterSubject, difficulty]);

  function openInstructions(spec: ExamSpec) {
    setExam(spec);
    setTestType("full");
    setDifficulty("mixed");
    setChapterSubject(spec.subjects[0].name);
    setAgreed(false);
    setError(null);
    setAvailableCount(null);
    setPhase("instructions");
  }

  async function beginExam() {
    setError(null);
    setPhase("loading");
    setLoadProgress("Preparing your exam…");
    try {
      let qs = await loadQuestions(exam);
      setQuestions(qs);
      setAnswers(Array(qs.length).fill(null));
      setMarked(Array(qs.length).fill(false));
      setVisited(Array(qs.length).fill(false).map((_, i) => i === 0));
      setTimePerQ(Array(qs.length).fill(0));
      setCurrent(0);
      setActiveSection(qs[0].subject);
      const minutes = testType === "chapter" ? 30 : exam.duration_min;
      setSecondsLeft(minutes * 60);
      startedAtRef.current = Date.now();
      lastTickRef.current = Date.now();
      setPhase("running");
      setTimeout(() => enterFullscreen(), 200);
    } catch (e) {
      console.error("[mock-tests] beginExam failed", e);
      setError("We could not prepare this test right now. Please try again in a moment.");
      setPhase("instructions");
    }
  }



  function pick(value: string) {
    setAnswers((a) => a.map((v, i) => (i === current ? value : v)));
  }

  function navigate(idx: number) {
    if (idx < 0 || idx >= questions.length) return;
    setCurrent(idx);
    setActiveSection(questions[idx].subject);
    setVisited((v) => v.map((b, i) => (i === idx ? true : b)));
    setPaletteOpen(false);
  }

  function jumpToSection(sub: string) {
    const idx = questions.findIndex((q) => q.subject === sub);
    if (idx >= 0) navigate(idx);
  }

  function toggleMark() {
    setMarked((m) => m.map((b, i) => (i === current ? !b : b)));
  }

  function saveAndNext() {
    if (current < questions.length - 1) navigate(current + 1);
    else setPhase("summary");
  }

  function markAndNext() {
    setMarked((m) => m.map((b, i) => (i === current ? true : b)));
    saveAndNext();
  }

  async function finish(auto = false) {
    if (phase !== "running" && phase !== "summary") return;
    exitFullscreen();
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
        if (isCorrect) { correct += 1; sub.correct += 1; } else wrong += 1;
      }
      subMap.set(q.subject, sub);
    });
    const score = correct * exam.marking.correct - wrong * exam.marking.wrong;
    const max_score = questions.length * exam.marking.correct;
    const subject_breakdown: SubjectStat[] = Array.from(subMap.entries()).map(([subject, s]) => ({
      subject, correct: s.correct, total: s.total,
    }));
    setPhase("result");
    if (auto) {
      // small UX: nothing extra; result page will indicate auto-submit via badge.
    }
    if (user) {
      try {
        const r = await recordAttemptAndAwardXP(user.id, {
          exam_key: exam.key, exam_name: exam.name,
          total_questions: questions.length, attempted, correct, wrong, score, max_score,
          duration_seconds: duration, subject_breakdown,
        });
        setReward({ earnedXp: r.earnedXp, newBadges: r.newBadges });
      } catch (e) { console.error("save attempt failed", e); }
    }
  }

  function reset() {
    setPhase("select");
    setQuestions([]); setAnswers([]); setMarked([]); setVisited([]); setTimePerQ([]);
    setCurrent(0); setError(null); setReward(null);
  }

  // ---- Status counts
  const counts = useMemo(() => {
    let answered = 0, notAnswered = 0, notVisited = 0, markedOnly = 0, answeredMarked = 0;
    questions.forEach((_, i) => {
      const a = answers[i];
      const v = visited[i];
      const m = marked[i];
      const isAns = a !== null && a !== "";
      if (m && isAns) answeredMarked++;
      else if (m) markedOnly++;
      else if (isAns) answered++;
      else if (v) notAnswered++;
      else notVisited++;
    });
    return { answered, notAnswered, notVisited, markedOnly, answeredMarked };
  }, [questions, answers, visited, marked]);

  const sections = useMemo(() => {
    const set = new Map<string, number>();
    questions.forEach((q) => set.set(q.subject, (set.get(q.subject) ?? 0) + 1));
    return Array.from(set.entries());
  }, [questions]);

  // ---- Result stats
  const stats = useMemo(() => {
    if (phase !== "result") return null;
    let correct = 0, wrong = 0, attempted = 0;
    const subMap = new Map<string, { correct: number; total: number; time: number }>();
    questions.forEach((q, i) => {
      const cur = subMap.get(q.subject) ?? { correct: 0, total: 0, time: 0 };
      cur.total += 1; cur.time += timePerQ[i] ?? 0;
      const ans = answers[i];
      if (ans !== null && ans !== "") {
        attempted += 1;
        const isCorrect = q.type === "mcq"
          ? Number(ans) === q.correct
          : Math.abs(parseFloat(ans) - Number(q.correct)) < 0.01;
        if (isCorrect) { correct += 1; cur.correct += 1; } else wrong += 1;
      }
      subMap.set(q.subject, cur);
    });
    const score = correct * exam.marking.correct - wrong * exam.marking.wrong;
    const max_score = questions.length * exam.marking.correct;
    const percent = Math.max(0, Math.round((score / Math.max(1, max_score)) * 100));
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const rank = Math.max(1, Math.round((100 - percent) * 1500));
    const subs = Array.from(subMap.entries()).map(([s, v]) => ({
      subject: s, ...v, pct: Math.round((v.correct / Math.max(1, v.total)) * 100),
      avg: v.total ? Math.round(v.time / v.total) : 0,
    }));
    const weakest = [...subs].sort((a, b) => a.pct - b.pct)[0];
    const strongest = [...subs].sort((a, b) => b.pct - a.pct)[0];
    const totalTime = timePerQ.reduce((a, b) => a + b, 0);
    const avgPerQ = questions.length ? Math.round(totalTime / questions.length) : 0;
    const suggestions: string[] = [];
    if (weakest && weakest.pct < 50) suggestions.push(`Focus your next 7 days on ${weakest.subject} — current accuracy is only ${weakest.pct}%.`);
    if (accuracy < 60 && attempted > 5) suggestions.push(`Accuracy is ${accuracy}%. Slow down on tricky questions to reduce silly mistakes.`);
    if (avgPerQ > 150) suggestions.push(`Average time per question is ${avgPerQ}s — practice timed sets to improve speed.`);
    if (avgPerQ < 30 && attempted > 5) suggestions.push("Your pacing is very fast — double-check answers before moving on.");
    if (questions.length - attempted > questions.length * 0.25) suggestions.push(`You skipped ${questions.length - attempted} questions. Even a guess on no-negative questions can boost your score.`);
    if (strongest && strongest.pct >= 80) suggestions.push(`${strongest.subject} is your strength (${strongest.pct}%). Maintain it with weekly revision.`);
    if (suggestions.length === 0) suggestions.push("Great consistency across sections — push to the next difficulty tier next time.");
    return { correct, wrong, attempted, skipped: questions.length - attempted, score, max_score, percent, accuracy, rank, subs, weakest, strongest, totalTime, avgPerQ, suggestions };
  }, [phase, questions, answers, exam, timePerQ]);

  // ============== RENDER ==============

  // SELECT / INSTRUCTIONS / LOADING / RESULT use PageShell. RUNNING / SUMMARY are CBT shell (no nav).
  const isCBT = phase === "running" || phase === "summary";

  if (isCBT) {
    return (
      <div ref={examRootRef} className="min-h-screen bg-background text-foreground">
        {phase === "running" && questions.length > 0 && (
          <RunningView
            exam={exam}
            questions={questions}
            current={current}
            answers={answers}
            marked={marked}
            visited={visited}
            secondsLeft={secondsLeft}
            sections={sections}
            activeSection={activeSection}
            counts={counts}
            fullscreen={fullscreen}
            paletteOpen={paletteOpen}
            user={user}
            onPick={pick}
            onNavigate={navigate}
            onSection={jumpToSection}
            onMark={toggleMark}
            onClear={() => pick("")}
            onSaveAndNext={saveAndNext}
            onMarkAndNext={markAndNext}
            onPrev={() => navigate(current - 1)}
            onSubmit={() => setPhase("summary")}
            onFullscreen={fullscreen ? exitFullscreen : enterFullscreen}
            onTogglePalette={() => setPaletteOpen((b) => !b)}
          />
        )}
        {phase === "summary" && (
          <SummaryView
            exam={exam}
            counts={counts}
            total={questions.length}
            secondsLeft={secondsLeft}
            onBack={() => setPhase("running")}
            onSubmit={() => void finish(false)}
          />
        )}
      </div>
    );
  }

  return (
    <PageShell>
      {phase === "select" && (
        <>
          <PageHeader
            eyebrow="CBT Mock Tests"
            title="Real exam simulator — JEE, BITSAT, MHT CET, EAMCET"
            description="Production-grade CBT environment with full-screen mode, NTA-style question palette, section navigation, negative marking and deep analytics."
          />
          <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
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
                  <div key={e.key} className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:border-accent/40 hover:shadow-glow">
                    <div className="absolute right-3 top-3 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{e.short}</div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                      <Trophy className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold">{e.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{e.pattern}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.subjects.map((s) => (
                        <span key={s.name} className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.name} · {s.count}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground">Total: {total} questions · {e.duration_min} min</p>
                    <Button onClick={() => openInstructions(e)} className="mt-4 w-full bg-gradient-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" /> Start mock test
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {phase === "instructions" && (
        <InstructionsView
          exam={exam}
          testType={testType}
          setTestType={setTestType}
          chapterSubject={chapterSubject}
          setChapterSubject={setChapterSubject}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          agreed={agreed}
          setAgreed={setAgreed}
          error={error}
          availableCount={availableCount}
          checkingAvailability={checkingAvailability}
          onBack={() => setPhase("select")}
          onBegin={beginExam}
        />
      )}

      {phase === "loading" && (
        <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <h2 className="mt-6 font-display text-xl font-semibold">{exam.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadProgress}</p>
          <p className="mt-1 text-xs text-muted-foreground">Fetching curated questions from the Nexoras question bank…</p>
        </section>
      )}


      {phase === "result" && stats && (
        <ResultView exam={exam} stats={stats} reward={reward} questions={questions} answers={answers} onReset={reset} />
      )}
    </PageShell>
  );
}

/* ===================== SUB-VIEWS ===================== */

function InstructionsView(props: {
  exam: ExamSpec; testType: TestType; setTestType: (t: TestType) => void;
  chapterSubject: string; setChapterSubject: (s: string) => void;
  difficulty: Difficulty; setDifficulty: (d: Difficulty) => void;
  agreed: boolean; setAgreed: (b: boolean) => void; error: string | null;
  availableCount: number | null; checkingAvailability: boolean;
  onBack: () => void; onBegin: () => void;
}) {
  const { exam, testType, setTestType, chapterSubject, setChapterSubject, difficulty, setDifficulty, agreed, setAgreed, error, availableCount, checkingAvailability, onBack, onBegin } = props;
  const total = testType === "chapter" ? 25 : exam.subjects.reduce((a, s) => a + s.count, 0);
  const minutes = testType === "chapter" ? 30 : exam.duration_min;
  const noQuestions = availableCount === 0;
  const canBegin = agreed && !checkingAvailability;


  return (
    <section className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
        <ChevronLeft className="h-3 w-3" /> Back to all tests
      </button>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border bg-gradient-to-r from-primary/15 via-accent/10 to-transparent px-6 py-5">
          <p className="text-xs uppercase tracking-wider text-accent">{exam.pattern}</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{exam.name} — Test Instructions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Please read the following instructions carefully before starting.</p>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4 text-sm">
            <Section title="General Instructions">
              <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
                <li>The total duration of the examination is <span className="font-medium text-foreground">{minutes} minutes</span>.</li>
                <li>The clock in the top-right will count down from the start time. When it reaches 00:00, the test will be <span className="font-medium text-foreground">auto-submitted</span>.</li>
                <li>The Question Palette on the right shows the status of each question using the legend below.</li>
                <li>You can navigate between questions using <span className="font-medium text-foreground">Previous</span>, <span className="font-medium text-foreground">Save & Next</span>, or by clicking a question number in the palette.</li>
                <li>Click <span className="font-medium text-foreground">Mark for Review</span> if you want to revisit a question later.</li>
              </ul>
            </Section>

            <Section title="Navigation & Sections">
              <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
                <li>You can switch between sections using the section tabs at the top of the screen.</li>
                <li>Selecting an option does not save the answer until you click <span className="font-medium text-foreground">Save & Next</span> or move to another question.</li>
                <li>Use <span className="font-medium text-foreground">Clear Response</span> to deselect your chosen option.</li>
              </ul>
            </Section>

            <Section title="Marking Scheme">
              <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
                <li>Correct answer: <span className="font-medium text-emerald-400">+{exam.marking.correct}</span></li>
                <li>Incorrect answer: <span className="font-medium text-rose-400">−{exam.marking.wrong}</span></li>
                <li>Unattempted: <span className="font-medium text-foreground">0</span></li>
              </ul>
            </Section>

            <Section title="Question Status Legend">
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <PaletteLegend color="bg-emerald-500/30 border-emerald-400/60" label="Answered" />
                <PaletteLegend color="bg-rose-500/20 border-rose-400/50" label="Not Answered" />
                <PaletteLegend color="bg-background/40 border-border" label="Not Visited" />
                <PaletteLegend color="bg-purple-500/25 border-purple-400/60" label="Marked for Review" />
                <PaletteLegend color="bg-purple-500/40 border-purple-400/70" label="Answered & Marked" dot />
              </div>
            </Section>

            <Section title="Test Configuration">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Test Type</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ChoiceChip active={testType === "full"} onClick={() => setTestType("full")} label={`Full-length (${exam.subjects.reduce((a, s) => a + s.count, 0)} Qs · ${exam.duration_min}m)`} />
                    <ChoiceChip active={testType === "chapter"} onClick={() => setTestType("chapter")} label="Chapter-wise (25 Qs · 30m)" />
                  </div>
                </div>
                {testType === "chapter" && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exam.subjects.map((s) => (
                        <ChoiceChip key={s.name} active={chapterSubject === s.name} onClick={() => setChapterSubject(s.name)} label={s.name} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Difficulty</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["mixed", "easy", "medium", "hard"] as const).map((d) => (
                      <ChoiceChip key={d} active={difficulty === d} onClick={() => setDifficulty(d)} label={d[0].toUpperCase() + d.slice(1)} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <label className="flex items-start gap-2 rounded-xl border border-border bg-background/40 p-3 text-xs">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[oklch(0.65_0.22_295)]" />
              <span className="text-muted-foreground">
                I have read and understood all the instructions. I confirm that I will not engage in any malpractice and will follow the exam rules.
              </span>
            </label>

            {checkingAvailability && (
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                Checking the question bank for available questions…
              </div>
            )}
            {!checkingAvailability && availableCount !== null && availableCount > 0 && availableCount < total && (
              <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
                {availableCount} questions available for these filters. Your test will use as many as possible.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onBack}>Cancel</Button>
              <Button disabled={!canBegin} onClick={onBegin} className="bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" /> I'm ready — Begin Test
              </Button>
            </div>

          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Summary</p>
              <p className="mt-2 font-display text-2xl font-bold">{total} <span className="text-sm font-normal text-muted-foreground">questions</span></p>
              <p className="font-display text-2xl font-bold">{minutes}m <span className="text-sm font-normal text-muted-foreground">duration</span></p>
              <p className="mt-2 text-xs text-muted-foreground">+{exam.marking.correct} / −{exam.marking.wrong} marking</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs text-muted-foreground">
              <Maximize2 className="h-4 w-4 text-accent" />
              <p className="mt-2">The test will attempt to enter <span className="font-medium text-foreground">full-screen mode</span> for an authentic CBT experience. Avoid switching tabs during the exam.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RunningView(props: {
  exam: ExamSpec; questions: Question[]; current: number;
  answers: (string | null)[]; marked: boolean[]; visited: boolean[];
  secondsLeft: number; sections: [string, number][]; activeSection: string;
  counts: { answered: number; notAnswered: number; notVisited: number; markedOnly: number; answeredMarked: number };
  fullscreen: boolean; paletteOpen: boolean; user: { email?: string | null } | null;
  onPick: (v: string) => void; onNavigate: (i: number) => void; onSection: (s: string) => void;
  onMark: () => void; onClear: () => void; onSaveAndNext: () => void; onMarkAndNext: () => void;
  onPrev: () => void; onSubmit: () => void; onFullscreen: () => void; onTogglePalette: () => void;
}) {
  const { exam, questions, current, answers, marked, visited, secondsLeft, sections, activeSection, counts, fullscreen, paletteOpen, user,
    onPick, onNavigate, onSection, onMark, onClear, onSaveAndNext, onMarkAndNext, onPrev, onSubmit, onFullscreen, onTogglePalette } = props;
  const q = questions[current];
  const lowTime = secondsLeft < 300;
  return (
    <div className="flex min-h-screen flex-col">
      {/* CBT Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold">{exam.name}</p>
              <p className="text-[10px] text-muted-foreground">Nexoras CBT Simulator</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-background/60 px-2 py-1 text-xs sm:flex">
              <UserIcon className="h-3.5 w-3.5 text-accent" />
              <span className="max-w-[160px] truncate">{user?.email ?? "Candidate"}</span>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${lowTime ? "border-destructive/60 bg-destructive/10 text-destructive animate-pulse-glow" : "border-accent/40 bg-accent/10"}`}>
              <Timer className="h-4 w-4" />
              <span className="font-mono text-sm font-semibold">
                {Math.floor(secondsLeft / 3600).toString().padStart(2, "0")}:
                {Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0")}:
                {(secondsLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <button onClick={onFullscreen} title={fullscreen ? "Exit full-screen" : "Enter full-screen"} className="hidden rounded-lg border border-border bg-background/60 p-2 hover:border-accent/40 sm:block">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={onTogglePalette} className="rounded-lg border border-border bg-background/60 p-2 hover:border-accent/40 lg:hidden">
              <Menu className="h-4 w-4" />
            </button>
            <Button onClick={onSubmit} size="sm" className="bg-gradient-primary text-primary-foreground">Submit</Button>
          </div>
        </div>
        {/* Section tabs */}
        <div className="border-t border-border bg-background/80">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1 sm:px-4">
            {sections.map(([sub, n]) => {
              const active = activeSection === sub;
              return (
                <button key={sub} onClick={() => onSection(sub)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {sub} <span className="ml-1 opacity-70">({n})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[1fr_300px]">
        {/* Question pane */}
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-secondary/60 px-2 py-0.5 font-mono">Question {current + 1}</span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-accent">{q.subject}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{q.type === "numerical" ? "Numerical" : "MCQ"}</span>
            </div>
            <div className="text-muted-foreground">
              Marks: <span className="text-emerald-400">+{exam.marking.correct}</span> / <span className="text-rose-400">−{exam.marking.wrong}</span>
            </div>
          </div>

          <h3 className="mt-4 whitespace-pre-wrap text-base font-medium leading-relaxed">{q.q}</h3>

          <div className="mt-5">
            {q.type === "mcq" && q.options ? (
              <div className="grid gap-2">
                {q.options.map((opt, i) => {
                  const picked = answers[current] === String(i);
                  return (
                    <button key={i} onClick={() => onPick(String(i))}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${picked ? "border-accent/60 bg-accent/15" : "border-border bg-background/40 hover:border-accent/40"}`}>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-medium ${picked ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted-foreground">Enter numerical answer</label>
                <input type="number" step="any" value={answers[current] ?? ""} onChange={(e) => onPick(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-sm focus:border-accent/60 focus:outline-none"
                  placeholder="e.g. 3.14" />
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={onMark}>
              <Flag className="h-4 w-4" /> {marked[current] ? "Unmark" : "Mark for Review"}
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>Clear Response</Button>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={onPrev}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={onMarkAndNext}>Mark & Next</Button>
              <Button size="sm" onClick={onSaveAndNext} className="bg-gradient-primary text-primary-foreground">
                Save & Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside className={`${paletteOpen ? "fixed inset-0 z-30 bg-background/95 p-4 backdrop-blur lg:static lg:bg-transparent lg:p-0" : "hidden lg:block"}`}>
          <div className="glass h-full rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Palette</h4>
              <button onClick={onTogglePalette} className="text-xs text-accent lg:hidden">Close</button>
            </div>

            <div className="mt-3 max-h-[50vh] overflow-y-auto pr-1 lg:max-h-[55vh]">
              {sections.map(([sub]) => {
                const idxs = questions.map((qq, i) => ({ qq, i })).filter((x) => x.qq.subject === sub);
                return (
                  <div key={sub} className="mb-3">
                    <p className="mb-1.5 text-[10px] uppercase tracking-wider text-accent">{sub}</p>
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
                      {idxs.map(({ i }) => {
                        const ans = answers[i];
                        const isAns = ans !== null && ans !== "";
                        const isMarked = marked[i];
                        const isVisited = visited[i];
                        const isCurrent = i === current;
                        let cls = "bg-background/40 text-muted-foreground border-border";
                        if (isMarked && isAns) cls = "bg-purple-500/40 text-white border-purple-400/70";
                        else if (isMarked) cls = "bg-purple-500/25 text-purple-200 border-purple-400/60";
                        else if (isAns) cls = "bg-emerald-500/30 text-emerald-100 border-emerald-400/60";
                        else if (isVisited) cls = "bg-rose-500/20 text-rose-200 border-rose-400/50";
                        const ring = isCurrent ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : "";
                        return (
                          <button key={i} onClick={() => onNavigate(i)}
                            className={`relative grid h-8 w-8 place-items-center rounded border text-xs font-medium ${cls} ${ring}`}>
                            {i + 1}
                            {isMarked && isAns && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-[10px]">
              <PaletteLegend color="bg-emerald-500/30 border-emerald-400/60" label={`Answered (${counts.answered})`} />
              <PaletteLegend color="bg-rose-500/20 border-rose-400/50" label={`Not Answered (${counts.notAnswered})`} />
              <PaletteLegend color="bg-background/40 border-border" label={`Not Visited (${counts.notVisited})`} />
              <PaletteLegend color="bg-purple-500/25 border-purple-400/60" label={`Marked (${counts.markedOnly})`} />
              <PaletteLegend color="bg-purple-500/40 border-purple-400/70" label={`Answered+Marked (${counts.answeredMarked})`} dot />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryView(props: { exam: ExamSpec; counts: { answered: number; notAnswered: number; notVisited: number; markedOnly: number; answeredMarked: number }; total: number; secondsLeft: number; onBack: () => void; onSubmit: () => void; }) {
  const { exam, counts, total, secondsLeft, onBack, onSubmit } = props;
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
          <ListChecks className="h-4 w-4" /> Exam Summary — {exam.name}
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold">Are you sure you want to submit?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review your attempt below. Once submitted you cannot change your answers.</p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Total" value={total} />
          <SummaryTile label="Answered" value={counts.answered + counts.answeredMarked} tone="emerald" />
          <SummaryTile label="Not Answered" value={counts.notAnswered} tone="rose" />
          <SummaryTile label="Marked" value={counts.markedOnly} tone="purple" />
          <SummaryTile label="Answered & Marked" value={counts.answeredMarked} tone="purple" />
          <SummaryTile label="Not Visited" value={counts.notVisited} />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-background/40 p-4 text-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Timer className="h-3.5 w-3.5 text-accent" /> Time remaining
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {Math.floor(secondsLeft / 3600).toString().padStart(2, "0")}:
            {Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0")}:
            {(secondsLeft % 60).toString().padStart(2, "0")}
          </p>
        </div>

        {(counts.notAnswered + counts.notVisited + counts.markedOnly) > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>You have <span className="font-semibold">{counts.notAnswered + counts.notVisited}</span> unanswered question(s) and <span className="font-semibold">{counts.markedOnly}</span> marked-for-review item(s) without an answer.</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" /> Back to test
          </Button>
          <Button onClick={onSubmit} className="ml-auto bg-gradient-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-4 w-4" /> Submit Final
          </Button>
        </div>
      </div>
    </div>
  );
}

type ResultStats = {
  correct: number; wrong: number; attempted: number; skipped: number;
  score: number; max_score: number; percent: number; accuracy: number; rank: number;
  subs: { subject: string; correct: number; total: number; time: number; pct: number; avg: number }[];
  weakest: { subject: string; pct: number } | undefined;
  strongest: { subject: string; pct: number } | undefined;
  totalTime: number; avgPerQ: number; suggestions: string[];
};

function ResultView(props: {
  exam: ExamSpec;
  stats: ResultStats;
  reward: { earnedXp: number; newBadges: { name: string; description: string }[] } | null;
  questions: Question[]; answers: (string | null)[]; onReset: () => void;
}) {
  const { exam, stats, reward, questions, answers, onReset } = props;
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <div className="glass relative overflow-hidden rounded-2xl p-6 text-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{exam.name} · Result</p>
          <p className="mt-2 font-display text-6xl font-bold text-gradient">{stats.score}</p>
          <p className="text-sm text-muted-foreground">out of {stats.max_score} marks · {stats.percent}%</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs">
              <Trophy className="h-3 w-3 text-accent" /> Predicted rank: ~{stats.rank.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs">
              Accuracy {stats.accuracy}%
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
              Avg {stats.avgPerQ}s/Q
            </span>
          </div>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-4">
        <Tile icon={CheckCircle2} label="Correct" value={String(stats.correct)} />
        <Tile icon={XCircle} label="Wrong" value={String(stats.wrong)} />
        <Tile icon={BarChart3} label="Skipped" value={String(stats.skipped)} />
        <Tile icon={Timer} label="Time used" value={`${Math.floor(stats.totalTime / 60)}m`} />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold">Subject Performance</h3>
        <div className="mt-4 space-y-4">
          {stats.subs.map((s) => (
            <div key={s.subject}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{s.subject}</span>
                <span className="text-muted-foreground">{s.correct}/{s.total} · {s.pct}% · {s.avg}s avg</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary/60">
                <div className={`h-full ${s.pct >= 70 ? "bg-emerald-500" : s.pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
            <AlertTriangle className="h-4 w-4" /> Weak topic detected
          </div>
          <p className="mt-2 font-display text-xl font-semibold">{stats.weakest?.subject ?? "—"}</p>
          <p className="text-sm text-muted-foreground">Current accuracy: <span className="text-rose-400">{stats.weakest?.pct ?? 0}%</span></p>
          <p className="mt-2 text-xs text-muted-foreground">Strengthen fundamentals and revisit PYQs on this subject.</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400">
            <Trophy className="h-4 w-4" /> Your strength
          </div>
          <p className="mt-2 font-display text-xl font-semibold">{stats.strongest?.subject ?? "—"}</p>
          <p className="text-sm text-muted-foreground">Accuracy: <span className="text-emerald-400">{stats.strongest?.pct ?? 0}%</span></p>
          <p className="mt-2 text-xs text-muted-foreground">Maintain consistency with weekly timed sets.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
          <Brain className="h-4 w-4" /> AI Improvement Suggestions
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {stats.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="glass rounded-2xl p-6">
        <summary className="cursor-pointer text-sm font-medium">Review all answers & explanations</summary>
        <div className="mt-4 space-y-3">
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

      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCcw className="h-4 w-4" /> Take another test
      </Button>
    </section>
  );
}

/* ===================== Tiny atoms ===================== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
function ChoiceChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs ${active ? "border-accent/60 bg-gradient-primary text-primary-foreground" : "border-border bg-background/40 hover:border-accent/40"}`}>
      {label}
    </button>
  );
}
function PaletteLegend({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={`relative inline-block h-3.5 w-3.5 rounded border ${color}`}>
        {dot && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      </span>
      {label}
    </div>
  );
}
function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "rose" | "purple" }) {
  const c = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : tone === "purple" ? "text-purple-300" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4 text-center">
      <p className={`font-display text-2xl font-bold ${c}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
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
