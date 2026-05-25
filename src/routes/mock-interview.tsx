import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic, Send, Loader2, Bot, User as UserIcon, Sparkles, RotateCcw, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mock-interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview — Nexoras" },
      { name: "description", content: "Practice realistic interviews with role-specific AI questions, follow-ups, and personalised scoring." },
    ],
  }),
  component: MockInterviewPage,
});

const ROLES = [
  "Software Engineer", "AI Engineer", "Data Scientist", "Cybersecurity Analyst",
  "UI/UX Designer", "Doctor", "Lawyer", "IAS Officer",
  "Mechanical Engineer", "Business Analyst", "Product Manager", "Marketing Manager",
] as const;
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

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

const HISTORY_KEY = "nexoras.mockInterview.history.v1";

function MockInterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [role, setRole] = useState<string>(ROLES[0]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Intermediate");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function systemPrompt() {
    return `You are an expert ${role} interviewer running a ${level.toLowerCase()}-level mock interview. Ask ONE focused interview question at a time. Mix technical, scenario, and behavioural questions appropriate to the role. After each candidate answer, briefly acknowledge it in one short sentence and then ask a smart, role-specific follow-up that probes deeper into their reasoning, experience, or weakest point. Keep questions concise (1-3 sentences), realistic, and progressively harder. Never reveal the answer. Never produce feedback yet — just continue the interview until the candidate ends it.`;
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
    return acc;
  }

  async function startInterview() {
    setPhase("interview");
    setMessages([]);
    setFeedback(null);
    setBusy(true);
    try {
      // Seed with a kickoff user "begin" message so AI asks first question.
      const seed: Msg[] = [{
        id: crypto.randomUUID(),
        role: "user",
        content: `Please start the interview now for the role of ${role} at ${level} level. Greet me briefly and ask your first question.`,
      }];
      setMessages(seed);
      await streamChat(seed, systemPrompt());
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
    const next: Msg[] = [...messages, { id: crypto.randomUUID(), role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      await streamChat(next, systemPrompt());
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
      const sys = `You are a senior hiring manager scoring a mock interview for the role of ${role} at ${level} level. Read the transcript and respond ONLY with valid minified JSON (no markdown, no commentary) matching this exact shape:
{"communication": <0-100 integer>, "confidence": <0-100 integer>, "technical": <0-100 integer>, "overall": <0-100 integer>, "strengths": ["...","..."], "improvements": ["...","..."], "summary": "2-3 sentence overall verdict"}`;
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
      // Extract JSON from response
      const match = acc.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse feedback");
      const parsed: Feedback = JSON.parse(match[0]);
      setFeedback(parsed);
      setPhase("feedback");
      // Save to history
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift({ at: Date.now(), role, level, feedback: parsed });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 20)));
      } catch { /* ignore */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to score");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPhase("setup");
    setMessages([]);
    setFeedback(null);
    setInput("");
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Mock Interview"
        title="Practice the interview that gets you hired"
        description="Pick your role and difficulty. Nexoras AI runs a realistic, role-specific interview with smart follow-ups and detailed scoring."
      />

      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        {phase === "setup" && (
          <div className="glass space-y-6 rounded-2xl p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">Choose your role</label>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                      role === r
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

            <Button
              onClick={startInterview}
              disabled={busy}
              size="lg"
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              {busy ? "Starting…" : `Start ${level} Interview as ${role}`}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Tip: answer each question thoughtfully. The AI adapts follow-ups to your responses.
            </p>
          </div>
        )}

        {phase === "interview" && (
          <div className="glass flex h-[70vh] flex-col rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Interviewing for</span>{" "}
                <span className="font-semibold text-gradient">{role}</span>{" "}
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
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendAnswer();
                  }
                }}
                placeholder="Type your answer… (Shift+Enter for newline)"
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
          </div>
        )}

        {phase === "feedback" && feedback && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Performance Report</p>
                  <h2 className="font-display text-2xl font-bold">
                    {role} <span className="text-gradient">· {level}</span>
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
