import { createFileRoute } from "@tanstack/react-router";
import { authedFetch } from "@/lib/authed-fetch";
import { useEffect, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic, MicOff, Send, Loader2, Bot, User as UserIcon, Sparkles, RotateCcw,
  BarChart3, Briefcase, Plane, MessagesSquare, Building2, Globe2, Cpu,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mock-interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview — HR · Technical · Visa · Behavioral | Nexoras" },
      { name: "description", content: "Practice realistic mock interviews with an AI interviewer. Technical, HR, US/student visa, behavioral and communication rounds with voice mic, live transcription and scoring." },
    ],
  }),
  component: () => (
    <PremiumGate feature="AI Mock Interviews">
      <MockInterviewPage />
    </PremiumGate>
  ),
});

type Category = {
  key: string;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  options: readonly string[];
  optionLabel: string;
  systemBuilder: (role: string, level: string) => string;
};

const TECHNICAL_ROLES = [
  "Software Engineer", "AI Engineer", "Data Scientist", "Cybersecurity Analyst",
  "UI/UX Designer", "Mechanical Engineer", "Business Analyst", "Product Manager",
] as const;

const HR_ROLES = [
  "Software Engineer", "Product Manager", "Marketing Manager", "Data Analyst",
  "Operations Manager", "Sales Executive", "Consultant", "Generic Corporate",
] as const;

const VISA_TYPES = [
  "USA F-1 Student Visa", "USA H-1B Work Visa", "USA B1/B2 Tourist Visa",
  "Canada Study Permit", "UK Tier-4 Student Visa", "Schengen Tourist Visa",
  "Australia Student Visa (500)",
] as const;

const STUDENT_VISA_TYPES = [
  "USA F-1 (MS/PhD)", "USA F-1 (Undergraduate)", "Canada Study Permit",
  "UK Student Visa", "Australia 500", "Germany Student Visa", "Ireland Stamp 2",
] as const;

const BEHAVIORAL_TOPICS = [
  "Leadership & ownership", "Conflict resolution", "Failure & learning",
  "Teamwork & collaboration", "Time management", "Customer obsession",
  "Innovation / bias for action",
] as const;

const COMMUNICATION_FOCUS = [
  "Public speaking", "Group discussion", "Storytelling", "Active listening",
  "Pitching an idea", "Negotiation",
] as const;

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const CATEGORIES: Category[] = [
  {
    key: "technical", label: "Technical Interview", icon: Cpu,
    blurb: "Role-specific, deep-dive technical questions with smart follow-ups.",
    options: TECHNICAL_ROLES, optionLabel: "Choose your role",
    systemBuilder: (role, level) =>
      `You are a senior ${role} interviewing a candidate at ${level.toLowerCase()} level. Ask ONE focused technical question at a time — coding, system-design, fundamentals, or scenario-based. Briefly acknowledge each answer in one sentence, then ask a smart role-specific follow-up that probes deeper. Mix in 1-2 behavioral questions every ~5 questions. Keep questions concise (1-3 sentences), realistic and progressively harder. Never reveal answers. Continue until candidate ends.`,
  },
  {
    key: "hr", label: "HR Interview", icon: Building2,
    blurb: "HR round practice: motivation, culture-fit, salary, expectations.",
    options: HR_ROLES, optionLabel: "Target role",
    systemBuilder: (role, level) =>
      `You are an HR manager interviewing a candidate for a ${role} position at ${level.toLowerCase()} level. Ask ONE HR-style question at a time — motivation, strengths/weaknesses, why this company, salary expectations, career goals, conflict handling, culture-fit. Acknowledge each answer in one sentence then ask a polite, probing follow-up. Stay warm but professional. Never reveal model answers.`,
  },
  {
    key: "visa", label: "Visa Interview", icon: Plane,
    blurb: "Realistic embassy / consular officer simulation.",
    options: VISA_TYPES, optionLabel: "Visa type",
    systemBuilder: (role, level) =>
      `You are a strict but fair consular officer conducting a ${role} interview. The interview is at ${level.toLowerCase()} difficulty. Ask ONE direct visa-officer question at a time — purpose of travel, ties to home country, financials, sponsor, itinerary, prior travel, intent to return. Keep questions short and sharp (1-2 sentences). After each answer give a single short reaction word ("Okay.", "I see.", "Hmm.") and immediately ask the next question. Do NOT coach. Continue until candidate ends.`,
  },
  {
    key: "student-visa", label: "Student Visa Interview", icon: Globe2,
    blurb: "Detailed F-1 / study-permit officer simulation.",
    options: STUDENT_VISA_TYPES, optionLabel: "Visa type",
    systemBuilder: (role, level) =>
      `You are a consular officer running a ${role} interview at ${level.toLowerCase()} difficulty. Ask ONE student-visa-officer question at a time — university name, program, why this university, why this country, funding source, sponsor income, GRE/IELTS scores, post-study plans, ties to home country. Keep questions short and sharp. Brief neutral acknowledgement only. Do NOT coach. Continue until candidate ends.`,
  },
  {
    key: "us-visa", label: "US Visa Mock", icon: Plane,
    blurb: "US embassy F-1 / H-1B / B1-B2 officer simulation.",
    options: ["F-1 Student Visa", "H-1B Work Visa", "B1/B2 Visitor", "L-1 Intra-company", "O-1 Extraordinary"] as const,
    optionLabel: "US visa category",
    systemBuilder: (role, level) =>
      `You are a US consular officer at a US embassy conducting a ${role} visa interview at ${level.toLowerCase()} difficulty. Ask ONE crisp question at a time in the brisk style of a real US visa officer — purpose, sponsor, funds, ties to home country, university/employer, prior US travel, intent to return. Replies must be 1-2 sentences. After each answer, react in one word and immediately ask the next question. Do NOT give tips during the interview.`,
  },
  {
    key: "behavioral", label: "Behavioral Interview", icon: MessagesSquare,
    blurb: "STAR-style behavioral questions and follow-ups.",
    options: BEHAVIORAL_TOPICS, optionLabel: "Focus area",
    systemBuilder: (role, level) =>
      `You are an experienced behavioral interviewer focusing on "${role}" at ${level.toLowerCase()} difficulty. Ask ONE STAR-format behavioral question at a time ("Tell me about a time when…"). After each answer, acknowledge briefly and probe deeper — challenge the Situation, ask for the candidate's specific Actions, quantify Results, and look for ownership. Never reveal ideal answers.`,
  },
  {
    key: "communication", label: "Communication Practice", icon: Briefcase,
    blurb: "Improve fluency, structure, clarity and confidence.",
    options: COMMUNICATION_FOCUS, optionLabel: "Focus skill",
    systemBuilder: (role, level) =>
      `You are a communication coach running a ${level.toLowerCase()} session focused on "${role}". Give ONE short speaking prompt at a time (e.g. "Describe a recent project in 60 seconds", "Convince me to use Nexoras"). After the candidate responds, give very brief feedback (1-2 sentences) on clarity, structure and filler words, then give the next prompt. Be encouraging but specific.`,
  },
];

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Phase = "setup" | "interview" | "feedback";
type Feedback = {
  communication: number;
  confidence: number;
  technical: number;
  overall: number;
  strengths: string[];
  improvements: string[];
  summary: string;
};

const HISTORY_KEY = "nexoras.mockInterview.history.v2";

// --- Web Speech API (browser-native, free)
type SR = {
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};
function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function MockInterviewPage() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [option, setOption] = useState<string>(CATEGORIES[0].options[0]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Intermediate");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const srRef = useRef<SR | null>(null);
  const interimRef = useRef<string>("");

  useEffect(() => {
    setVoiceSupported(getSR() !== null);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    setOption(category.options[0]);
  }, [category]);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      const clean = text.replace(/[*_`#>\-]+/g, " ").slice(0, 500);
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1.0; u.pitch = 1.0; u.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }

  function toggleMic() {
    if (!voiceSupported) {
      toast.error("Voice input not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      srRef.current?.stop();
      return;
    }
    const sr = getSR();
    if (!sr) return;
    sr.lang = "en-US";
    sr.continuous = true;
    sr.interimResults = true;
    interimRef.current = "";
    sr.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      const combined = (finalText + " " + interim).trim();
      setInput((prev) => {
        // Replace the last interim portion if we tracked one
        const base = prev.endsWith(interimRef.current) && interimRef.current
          ? prev.slice(0, prev.length - interimRef.current.length)
          : prev;
        interimRef.current = combined;
        return (base + " " + combined).trim();
      });
    };
    sr.onerror = (ev) => {
      if (ev.error && ev.error !== "no-speech" && ev.error !== "aborted") {
        toast.error(`Mic error: ${ev.error}`);
      }
    };
    sr.onend = () => setListening(false);
    try {
      sr.start();
      srRef.current = sr;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  async function streamChat(allMessages: Msg[], system: string): Promise<string> {
    const res = await authedFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) {
      let err = `Request failed (${res.status})`;
      try { const j = await res.json(); if (j?.error) err = j.error; } catch { /* ignore */ }
      throw new Error(err);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, role: "assistant", content: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: acc } : m)));
    }
    speak(acc);
    return acc;
  }

  async function startInterview() {
    setPhase("interview");
    setMessages([]);
    setFeedback(null);
    setBusy(true);
    try {
      const seed: Msg[] = [{
        id: crypto.randomUUID(),
        role: "user",
        content: `Please start the ${category.label} now for "${option}" at ${level} level. Greet me briefly in one line and ask your first question.`,
      }];
      setMessages(seed);
      await streamChat(seed, category.systemBuilder(option, level));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
      setPhase("setup");
    } finally {
      setBusy(false);
    }
  }

  async function sendAnswer() {
    const text = input.trim();
    if (!text || busy) return;
    if (listening) srRef.current?.stop();
    interimRef.current = "";
    const next: Msg[] = [...messages, { id: crypto.randomUUID(), role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      await streamChat(next, category.systemBuilder(option, level));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function endAndScore() {
    if (busy) return;
    setBusy(true);
    try {
      const transcript = messages
        .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\n\n");
      const sys = `You are a senior evaluator scoring a ${category.label} for "${option}" at ${level} level. Read the transcript and respond ONLY with valid minified JSON (no markdown, no commentary) matching this exact shape:
{"communication": <0-100>, "confidence": <0-100>, "technical": <0-100>, "overall": <0-100>, "strengths": ["...","..."], "improvements": ["...","..."], "summary": "2-3 sentence verdict"}`;
      const res = await authedFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: sys,
          messages: [{ role: "user", content: `Transcript:\n${transcript}\n\nReturn the JSON now.` }],
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      const match = acc.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse feedback");
      const parsed: Feedback = JSON.parse(match[0]);
      setFeedback(parsed);
      setPhase("feedback");
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({ at: Date.now(), category: category.label, option, level, feedback: parsed });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 30)));
      } catch { /* ignore */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to score");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (listening) srRef.current?.stop();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPhase("setup");
    setMessages([]);
    setFeedback(null);
    setInput("");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Mock Interview"
        title="Real interviews, real practice — by voice or text"
        description="HR, technical, visa, behavioral and communication rounds. Speak naturally into your mic; the AI listens, replies, and scores you."
      />

      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        {phase === "setup" && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <label className="mb-3 block text-sm font-semibold">Interview type</label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category.key === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c)}
                      className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? "border-accent/60 bg-gradient-card shadow-glow"
                          : "border-border bg-background/40 hover:border-accent/40"
                      }`}
                    >
                      <span className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary/70 text-accent"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass space-y-6 rounded-2xl p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">{category.optionLabel}</label>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {category.options.map((r) => (
                    <button
                      key={r}
                      onClick={() => setOption(r)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                        option === r
                          ? "border-accent/60 bg-gradient-primary text-primary-foreground shadow-glow"
                          : "border-border bg-background/40 hover:border-accent/40 hover:bg-secondary/60"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Difficulty</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        level === l
                          ? "border-accent/60 bg-gradient-primary text-primary-foreground shadow-glow"
                          : "border-border bg-background/40 hover:border-accent/40 hover:bg-secondary/60"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-accent" />
                {voiceSupported
                  ? "Mic enabled — tap the mic during the interview to speak naturally. The AI will reply by voice too."
                  : "Voice mic isn't supported in this browser. You can still type answers. (Tip: Chrome or Edge enables voice.)"}
              </div>

              <Button
                onClick={startInterview}
                disabled={busy}
                size="lg"
                className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {busy ? "Starting…" : `Start ${level} ${category.label}`}
              </Button>
            </div>
          </div>
        )}

        {phase === "interview" && (
          <div className="glass flex h-[70vh] flex-col rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <span className="text-muted-foreground">{category.label}</span>{" "}
                <span className="font-semibold text-gradient">· {option}</span>{" "}
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider">{level}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={endAndScore} variant="outline" size="sm" disabled={busy || messages.length < 2}>
                  <BarChart3 className="h-4 w-4" /> End & Score
                </Button>
                <Button onClick={reset} variant="ghost" size="sm" disabled={busy}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((m) => (
                <Bubble key={m.id} m={m} />
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI is thinking…
                </div>
              )}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <Button
                onClick={toggleMic}
                variant={listening ? "default" : "outline"}
                size="icon"
                className={listening ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : ""}
                disabled={busy}
                title={voiceSupported ? (listening ? "Stop listening" : "Speak your answer") : "Voice not supported"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendAnswer();
                  }
                }}
                placeholder={listening ? "Listening… speak naturally" : "Type or press mic to speak…"}
                rows={2}
                className="min-h-[52px] max-h-40 resize-none"
                disabled={busy}
              />
              <Button
                onClick={sendAnswer}
                disabled={busy || !input.trim()}
                className="bg-gradient-primary text-primary-foreground shadow-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {listening && (
              <p className="mt-1 text-center text-[11px] text-accent">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" /> Live transcription — tap mic again to stop
              </p>
            )}
          </div>
        )}

        {phase === "feedback" && feedback && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{category.label} Report</p>
                  <h2 className="font-display text-2xl font-bold">
                    {option} <span className="text-gradient">· {level}</span>
                  </h2>
                </div>
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="h-4 w-4" /> Try another
                </Button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreCard label="Overall" value={feedback.overall} highlight />
                <ScoreCard label="Communication" value={feedback.communication} />
                <ScoreCard label="Confidence" value={feedback.confidence} />
                <ScoreCard label="Technical" value={feedback.technical} />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/40 p-5">
                  <h3 className="font-display text-sm font-semibold text-accent">Strengths</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background/40 p-5">
                  <h3 className="font-display text-sm font-semibold text-accent">Areas to improve</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              <p className="mt-6 rounded-xl border border-border bg-background/40 p-4 text-sm leading-relaxed">
                <Sparkles className="mr-1 inline h-4 w-4 text-accent" />
                {feedback.summary}
              </p>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
        isUser ? "bg-secondary/70" : "bg-gradient-primary text-primary-foreground shadow-glow"
      }`}>
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser ? "bg-primary/15" : "border border-border/60 bg-background/40"
      }`}>
        {m.content || <span className="text-muted-foreground">…</span>}
      </div>
    </div>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-accent/40 bg-gradient-card shadow-glow" : "border-border bg-background/40"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-gradient">{pct}<span className="text-base text-muted-foreground">/100</span></p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
