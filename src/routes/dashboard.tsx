import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, Brain, Target, TrendingUp, Clock, BookOpen, Sparkles, Plus, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nexoras" }, { name: "description", content: "Your AI-powered student dashboard." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
  head: () => ({ meta: [{ title: "Dashboard — Nexoras" }, { name: "description", content: "Your AI-powered student dashboard." }] }),
  component: Dashboard,
});

const sidebarItems = [
  { icon: Brain, label: "Overview", active: true },
  { icon: Calendar, label: "Planner" },
  { icon: BookOpen, label: "Notes" },
  { icon: Target, label: "Goals" },
  { icon: TrendingUp, label: "Progress" },
];

function Dashboard() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl gap-6 px-4 py-8 lg:flex lg:px-8">
        {/* Side rail */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="glass sticky top-24 rounded-2xl p-3">
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
            <nav className="mt-2 space-y-1">
              {sidebarItems.map((s) => (
                <button
                  key={s.label}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    s.active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-xs">
              <p className="font-semibold text-foreground">Upgrade to Pro</p>
              <p className="mt-1 text-muted-foreground">Unlimited AI plans + premium tools.</p>
              <Link to="/pricing"><Button size="sm" className="mt-3 w-full bg-gradient-primary text-primary-foreground">See plans</Button></Link>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          {/* Greeting */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="font-display text-3xl font-bold">Good evening, <span className="text-gradient">Alex</span></h1>
            </div>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4" /> New AI plan
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock, label: "Focus time today", value: "3h 42m", trend: "+12%" },
              { icon: TrendingUp, label: "Weekly progress", value: "78%", trend: "+5%" },
              { icon: Target, label: "Goals on track", value: "6 / 8", trend: "" },
              { icon: Sparkles, label: "AI suggestions", value: "12 new", trend: "" },
            ].map((k) => (
              <div key={k.label} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <k.icon className="h-5 w-5 text-accent" />
                  {k.trend && <span className="text-xs text-accent">{k.trend}</span>}
                </div>
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className="font-display text-2xl font-bold">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Today plan */}
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Today's AI Schedule</h2>
                <Link to="/tools" className="text-xs text-accent inline-flex items-center gap-1">Edit plan <ArrowRight className="h-3 w-3" /></Link>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ["09:00 — 10:30", "Calculus · Practice problems", "Focus"],
                  ["11:00 — 12:00", "Data Structures · Trees revision", "Review"],
                  ["14:00 — 15:00", "Mock interview · System design", "Practice"],
                  ["16:30 — 17:30", "Resume polish + portfolio", "Build"],
                  ["20:00 — 21:00", "Reading: deep work", "Wind-down"],
                ].map(([t, l, tag]) => (
                  <div key={l} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{t}</span>
                    <span className="flex-1 px-3">{l}</span>
                    <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Coach + Resources */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /><span className="text-xs uppercase tracking-wider text-muted-foreground">AI Coach</span></div>
                <p className="mt-3 text-sm leading-relaxed">
                  You're 22% ahead of plan this week. Want to schedule a mock test for Friday at 4pm?
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground">Schedule</Button>
                  <Button size="sm" variant="outline">Later</Button>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-sm font-semibold">Suggested resources</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Master Big-O in 20 minutes", "Top 50 HR questions 2026", "How toppers structure their week"].map((r) => (
                    <li key={r}><Link to="/blog" className="text-muted-foreground hover:text-foreground">→ {r}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
