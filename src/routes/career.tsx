import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Briefcase, Compass, Mic, BookOpenCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/career")({
  head: () => ({ meta: [{ title: "Career Hub — Nexoras" }, { name: "description", content: "Interview prep, mock interviews, and personalized career guidance." }] }),
  component: Career,
});

function Career() {
  return (
    <PageShell>
      <PageHeader eyebrow="Career Hub" title="From classroom to career" description="Mock interviews, curated tracks, and AI-powered career guidance." />
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            { icon: Mic, t: "AI Mock Interviews", d: "Practice technical & HR rounds with realistic AI feedback." },
            { icon: BookOpenCheck, t: "Question Banks", d: "Curated topic-wise questions across 30+ companies." },
            { icon: Compass, t: "Career Roadmaps", d: "Personalized step-by-step paths to your dream role." },
          ].map((c) => (
            <div key={c.t} className="glass group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow"><c.icon className="h-5 w-5 text-primary-foreground" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              <Button variant="ghost" size="sm" className="mt-3 px-0 text-accent hover:bg-transparent">Start <ArrowRight className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold">Featured tracks</h3>
            <ul className="mt-4 space-y-3">
              {["Frontend Engineer · React/Next", "Product Manager · APM ready", "Data Analyst · SQL + Python", "UI/UX Designer · Portfolio first"].map((t) => (
                <li key={t} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
                  <span>{t}</span>
                  <Briefcase className="h-4 w-4 text-accent" />
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold">Upcoming AI sessions</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Today · 6 PM", "System design crash course"],
                ["Tomorrow · 11 AM", "Behavioral interview labs"],
                ["Sat · 4 PM", "Resume review with AI coach"],
              ].map(([when, what]) => (
                <li key={what} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
                  <span>{what}</span>
                  <span className="text-xs text-muted-foreground">{when}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup"><Button className="mt-5 w-full bg-gradient-primary text-primary-foreground shadow-glow">Reserve my seat</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
