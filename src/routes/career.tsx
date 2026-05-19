import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import {
  Briefcase, Compass, Mic, BookOpenCheck, ArrowRight, Target, Users,
  TrendingUp, Lightbulb, Award, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career Hub — Interview Prep & Career Guidance | Nexoras" },
      { name: "description", content: "Land your first role with Nexoras: AI mock interviews, curated technical + HR question banks, personalised career roadmaps, and behavioural prep guides for students and freshers." },
      { property: "og:title", content: "Nexoras Career Hub — From Classroom to Career" },
      { property: "og:description", content: "Interview prep, career roadmaps, and AI coaching for students." },
      { property: "og:url", content: "https://nexoras.online/career" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/career" }],
  }),
  component: Career,
});

const PILLARS = [
  { icon: Mic, t: "AI Mock Interviews", d: "Practice technical and HR rounds with realistic AI feedback on clarity, structure and pacing.", to: "/mock-interview" },
  { icon: BookOpenCheck, t: "Question Banks", d: "Curated topic-wise questions covering 30+ top product, service and startup companies.", to: "/practice" },
  { icon: Compass, t: "Career Roadmaps", d: "Personalised step-by-step paths from where you are today to your dream role.", to: "/roadmaps" },
];

const TRACKS = [
  { role: "Frontend Engineer", stack: "React / Next.js / TypeScript", lvl: "Beginner → Mid" },
  { role: "Backend Engineer", stack: "Node / Java / Python + DB", lvl: "Beginner → Mid" },
  { role: "Full-Stack Developer", stack: "MERN / Next + Supabase", lvl: "Beginner → Mid" },
  { role: "Data Analyst", stack: "SQL + Python + Tableau", lvl: "Beginner → Mid" },
  { role: "Machine Learning Engineer", stack: "Python + PyTorch + MLOps", lvl: "Intermediate" },
  { role: "Product Manager (APM)", stack: "User research + analytics + roadmaps", lvl: "Beginner → APM" },
  { role: "UI/UX Designer", stack: "Figma + design systems + portfolio", lvl: "Beginner → Mid" },
  { role: "DevOps / Cloud Engineer", stack: "AWS + Docker + Kubernetes", lvl: "Intermediate" },
];

const INTERVIEW_PHASES = [
  {
    n: "01",
    icon: Target,
    title: "Foundations (Weeks 1–2)",
    body: "Pick one language and master the standard library. Refresh CS fundamentals: arrays, strings, hashmaps, recursion. Solve 50 easy problems on a single platform. Read the JD of three target roles and reverse-engineer the skill list.",
  },
  {
    n: "02",
    icon: Lightbulb,
    title: "Pattern recognition (Weeks 3–6)",
    body: "Move into mediums by topic: two pointers, sliding window, binary search, trees, graphs, DP. The goal isn't 500 problems — it's 80 problems where you understand the underlying pattern and can derive the solution from scratch.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "System design + projects (Weeks 7–9)",
    body: "Ship one polished project that demonstrates your stack end-to-end. Learn the fundamentals of system design: load balancing, caching, databases, queues. For frontend roles, study component architecture and rendering performance instead.",
  },
  {
    n: "04",
    icon: Users,
    title: "Behavioural + mocks (Weeks 10–12)",
    body: "Write 8 STAR-format stories covering conflict, leadership, failure, ambiguity and growth. Run 6+ mock interviews — half technical, half behavioural. Record yourself and rewatch. The feedback loop matters more than the volume.",
  },
];

const TIPS = [
  {
    title: "How to answer 'Tell me about yourself'",
    body: "Use the present–past–future structure: what you do now (or are studying), one or two relevant past wins, and what you're aiming for next. Keep it under 90 seconds. Always end by pivoting to the role you're interviewing for.",
  },
  {
    title: "How to negotiate your first offer",
    body: "Always wait for a written offer before negotiating. Ask for a clear number, not a vague 'more'. Anchor on market data (Levels.fyi, AmbitionBox), not on what you 'need'. Negotiate base salary first, then signing bonus, then perks. Be polite but specific.",
  },
  {
    title: "What to do if you fail a round",
    body: "Ask for feedback in writing within 24 hours. Most companies won't share it, but a few will. Add the failure to your prep log along with one concrete fix. Then move on — one failed round tells you almost nothing about your overall ability.",
  },
];

function Career() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Career Hub"
        title="From classroom to career"
        description="A complete prep system: mock interviews, curated tracks, and AI-powered career guidance — built for students and freshers in India and beyond."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {PILLARS.map((c) => (
            <Link
              key={c.t}
              to={c.to}
              className="glass group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">{c.t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              <Button variant="ghost" size="sm" className="mt-3 px-0 text-accent hover:bg-transparent">
                Open <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured tracks */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Featured career tracks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a target role and we'll generate a personalised week-by-week roadmap.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((t) => (
            <div key={t.role} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <Briefcase className="h-4 w-4 text-accent" />
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.lvl}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{t.role}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.stack}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 12-week prep plan */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="glass-strong rounded-2xl p-6 lg:p-10">
          <h2 className="font-display text-2xl font-bold">The 12-week interview prep plan</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A structured, opinionated plan that has helped Nexoras students land roles at
            startups, service companies and product giants. Adapt the timeline to your own pace.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {INTERVIEW_PHASES.map((p) => (
              <article key={p.n} className="glass rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Phase {p.n}
                    </p>
                    <h3 className="font-display text-base font-semibold">{p.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Practical interview tips</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {TIPS.map((t) => (
            <article key={t.title} className="glass rounded-2xl p-6">
              <Award className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-display text-base font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="glass-strong rounded-2xl p-6 text-center lg:p-10">
          <FileText className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-3 font-display text-xl font-bold lg:text-2xl">
            Ready to start preparing?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your resume, run mock interviews, and follow a personalised roadmap — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/resume">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                Build my resume <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/mock-interview">
              <Button variant="outline">Try a mock interview</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
