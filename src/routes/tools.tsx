import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Brain, Calendar, Sparkles, Wand2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Study Tools — Nexoras" }, { name: "description", content: "AI study planner and timetable generator." }] }),
  component: Tools,
});

function Tools() {
  const [subjects, setSubjects] = useState("Math, Physics, DSA, English");
  const [hours, setHours] = useState(4);
  const [plan, setPlan] = useState<{ time: string; topic: string; mode: string }[] | null>(null);

  function generate() {
    const list = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    const slots = ["09:00", "11:00", "14:00", "16:00", "19:00", "21:00"];
    const modes = ["Focus", "Practice", "Revision", "Mock test"];
    const blockMins = Math.max(45, Math.floor((hours * 60) / Math.max(list.length, 1)));
    const generated = list.slice(0, slots.length).map((sub, i) => ({
      time: `${slots[i]} · ${blockMins}m`,
      topic: sub,
      mode: modes[i % modes.length],
    }));
    setPlan(generated);
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Study Planner"
        title="Build the perfect day, in seconds"
        description="Tell Nexoras what you need to study and we'll generate a balanced, distraction-free timetable powered by AI."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-accent" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Inputs</span></div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Subjects (comma separated)</label>
                <input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total study hours: <span className="text-accent">{hours}h</span></label>
                <input
                  type="range" min={1} max={10} value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-2 w-full accent-[oklch(0.7_0.2_275)]"
                />
              </div>
              <Button onClick={generate} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                <Sparkles className="h-4 w-4" /> Generate AI Plan
              </Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Generated Plan</span></div>
            {!plan ? (
              <div className="mt-10 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Brain className="h-10 w-10 text-accent" />
                <p className="mt-3 text-sm">Your AI-generated schedule will appear here.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {plan.map((p) => (
                  <div key={p.topic} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{p.time}</span>
                    <span className="flex-1 px-3">{p.topic}</span>
                    <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{p.mode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { icon: Clock, t: "Pomodoro built-in", d: "Focus blocks with smart breaks." },
            { icon: Brain, t: "Adaptive AI", d: "Plans evolve with your performance." },
            { icon: Calendar, t: "Sync everywhere", d: "Google, Apple & Outlook calendars." },
          ].map((x) => (
            <div key={x.t} className="glass rounded-xl p-5">
              <x.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-display font-semibold">{x.t}</h3>
              <p className="text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
