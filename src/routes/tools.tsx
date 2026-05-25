import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Brain, Calendar, Sparkles, Wand2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTimetable, type WeeklyTimetable } from "@/lib/timetable.functions";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "Study Tools — Nexoras" }, { name: "description", content: "AI study planner and timetable generator." }] }),
  component: () => (
    <RequireAuth>
      <Tools />
    </RequireAuth>
  ),
});

function Tools() {
  const generate = useServerFn(generateTimetable);
  const [goals, setGoals] = useState("Crack semester finals with 9+ GPA and finish DSA sheet.");
  const [subjects, setSubjects] = useState("Math, Physics, DSA, English");
  const [deadlines, setDeadlines] = useState("Math midterm in 10 days; DSA contest next Saturday; Physics lab report Friday.");
  const [hours, setHours] = useState(4);
  const [plan, setPlan] = useState<WeeklyTimetable | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    setLoading(true);
    setPlan(null);
    try {
      const result = await generate({ data: { goals, subjects, deadlines, hoursPerDay: hours } });
      setPlan(result);
      toast.success("Weekly timetable generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate timetable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="AI Study Planner"
        title="Build the perfect week, in seconds"
        description="Tell Nexoras your goals, subjects and deadlines — our AI builds a balanced 7-day timetable tailored to you."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-accent" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Inputs</span></div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Your goals</label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subjects (comma separated)</label>
                <input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deadlines & exams</label>
                <textarea
                  value={deadlines}
                  onChange={(e) => setDeadlines(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Available hours per day: <span className="text-accent">{hours}h</span></label>
                <input
                  type="range" min={1} max={12} value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-2 w-full accent-[oklch(0.7_0.2_275)]"
                />
              </div>
              <Button onClick={onGenerate} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating with AI…" : "Generate AI Plan"}
              </Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Generated Weekly Plan</span></div>
            {!plan ? (
              <div className="mt-10 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Brain className="h-10 w-10 text-accent" />
                <p className="mt-3 text-sm">{loading ? "AI is composing your week…" : "Your AI-generated schedule will appear here."}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">{plan.summary}</p>
                {plan.week.map((d) => (
                  <div key={d.day}>
                    <h4 className="font-display text-sm font-semibold text-accent">{d.day}</h4>
                    <div className="mt-2 space-y-2">
                      {d.blocks.map((b, i) => (
                        <div key={`${d.day}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{b.time}</span>
                          <span className="flex-1 px-3">{b.topic}{b.notes ? <span className="block text-xs text-muted-foreground">{b.notes}</span> : null}</span>
                          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{b.mode}</span>
                        </div>
                      ))}
                    </div>
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
