import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain, Calendar, Calculator, FileText, Briefcase, BookOpen,
  Sparkles, ArrowRight, Check, Zap, Target, Rocket, GraduationCap,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexoras — Study Smarter with AI" },
      { name: "description", content: "AI study planner, smart calculators, resume builder, interview prep & career guidance for students. The futuristic productivity OS for the next generation." },
      { property: "og:title", content: "Nexoras — Study Smarter with AI" },
      { property: "og:description", content: "The all-in-one AI productivity platform for students." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Brain, title: "AI Study Planner", desc: "Auto-generate timetables that adapt to your goals, deadlines and energy levels.", to: "/tools" },
  { icon: Calculator, title: "Smart Calculator Hub", desc: "CGPA, attendance, percentage, EMI, age — all in one premium calculator suite.", to: "/calculators" },
  { icon: FileText, title: "Resume Builder", desc: "Beautiful AI-assisted resumes optimized for ATS and recruiters.", to: "/resume" },
  { icon: Briefcase, title: "Interview Prep", desc: "Mock interviews, curated question banks, and feedback in real time.", to: "/career" },
  { icon: Target, title: "Career Guidance", desc: "Personalized career roadmaps mapped to your skills and interests.", to: "/career" },
  { icon: BookOpen, title: "Blog & Resources", desc: "Hand-picked guides, tutorials, and stories from top students.", to: "/blog" },
];

const stats = [
  { k: "120K+", v: "Students onboard" },
  { k: "9.4/10", v: "Avg satisfaction" },
  { k: "60+", v: "Universities" },
  { k: "24/7", v: "AI assistance" },
];

function Home() {
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <HeroOrbs />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 lg:px-8 lg:pt-28 lg:pb-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Introducing Nexoras 1.0
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Study Smarter <br />
              <span className="text-gradient">with AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The futuristic productivity OS for students. Plan your week, ace your exams,
              build your resume, and launch your career — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border bg-secondary/40 backdrop-blur">
                  View Live Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required • 14-day pro trial</p>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-20 blur-3xl" />
            <div className="glass-strong rounded-2xl p-2 shadow-elegant">
              <div className="rounded-xl border border-border bg-background/60 p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Calendar, label: "Today's Plan", value: "5 sessions" },
                    { icon: Zap, label: "Focus streak", value: "12 days" },
                    { icon: GraduationCap, label: "CGPA forecast", value: "8.7" },
                  ].map((s) => (
                    <div key={s.label} className="glass rounded-lg p-4">
                      <s.icon className="h-5 w-5 text-accent" />
                      <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
                      <p className="font-display text-xl font-semibold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="glass rounded-lg p-4 lg:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">AI Schedule</p>
                    <div className="mt-3 space-y-2">
                      {[
                        ["09:00", "Linear Algebra — chapter review", "Focus"],
                        ["11:30", "Mock interview · React", "Practice"],
                        ["14:00", "Resume polish session", "Build"],
                        ["16:30", "Quick CGPA check-in", "Review"],
                      ].map(([t, l, tag]) => (
                        <div key={l} className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{t}</span>
                          <span className="flex-1 px-3 truncate">{l}</span>
                          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">AI Coach</p>
                    <p className="mt-3 text-sm leading-relaxed">
                      You're 18% ahead of your weekly plan. Want me to add a mock test on Friday?
                    </p>
                    <Button size="sm" className="mt-4 w-full bg-gradient-primary text-primary-foreground">Yes, add it</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="glass grid grid-cols-2 gap-4 rounded-2xl p-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="text-center">
              <p className="font-display text-2xl font-bold text-gradient sm:text-3xl">{s.k}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">Everything you need</span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            One platform. <span className="text-gradient">Every student tool.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            From your morning study sprint to your first job offer — Nexoras has you covered.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group glass relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-30" />
              <div className="relative">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center shadow-elegant lg:p-16">
          <HeroOrbs />
          <div className="relative">
            <Rocket className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">
              Ready to <span className="text-gradient">level up</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join 120,000+ students already studying smarter with Nexoras.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">See pricing</Button>
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["Free forever plan", "Cancel anytime", "No credit card"].map((x) => (
                <li key={x} className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-accent" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
