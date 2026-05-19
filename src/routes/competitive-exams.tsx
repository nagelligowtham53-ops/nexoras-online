import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, FileText, ArrowRight, CalendarClock, Target } from "lucide-react";

export const Route = createFileRoute("/competitive-exams")({
  head: () => ({
    meta: [
      { title: "Competitive Exams in India — JEE, NEET, BITSAT, EAMCET, GATE, CAT, UPSC | Nexoras" },
      { name: "description", content: "Comprehensive guides to India's top competitive exams. Eligibility, syllabus highlights, prep timeline, and ideal starting points for JEE Main, JEE Advanced, NEET, BITSAT, EAMCET, MHT CET, GATE, CAT, UPSC, CLAT and more." },
      { property: "og:title", content: "Competitive Exams in India — Nexoras" },
      { property: "og:description", content: "Every major Indian exam, explained: eligibility, syllabus, strategy, timelines." },
      { property: "og:url", content: "https://nexoras.online/competitive-exams" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/competitive-exams" }],
  }),
  component: CompetitiveExamsPage,
});

type Exam = {
  name: string;
  purpose: string;
  level: string;
  attempts: string;
  syllabus: string;
  prepTime: string;
  link?: string;
};

const EXAMS: Exam[] = [
  { name: "JEE Main + Advanced", purpose: "B.Tech in NITs / IIITs / IITs", level: "12th Science (PCM)", attempts: "Twice/year (Main)", syllabus: "Physics, Chemistry, Mathematics — NCERT + advanced", prepTime: "18–24 months", link: "/crack-jee" },
  { name: "NEET UG", purpose: "MBBS / BDS admissions", level: "12th Science (PCB)", attempts: "Once/year", syllabus: "Physics, Chemistry, Biology — NCERT heavy", prepTime: "18–24 months" },
  { name: "BITSAT", purpose: "BITS Pilani / Goa / Hyderabad", level: "12th PCM", attempts: "Twice/year", syllabus: "PCM + English + Logical reasoning, computer-based", prepTime: "12 months", link: "/mock-tests" },
  { name: "MHT CET", purpose: "Maharashtra Engg / Pharm", level: "12th PCM/PCB", attempts: "Once/year", syllabus: "Maharashtra board PCM/PCB, MCQ-based", prepTime: "12 months", link: "/mock-tests" },
  { name: "EAMCET (AP/TS)", purpose: "AP / Telangana Engg & Med", level: "12th PCM/PCB", attempts: "Once/year", syllabus: "State board PCM/PCB + speed-focused MCQs", prepTime: "12 months", link: "/mock-tests" },
  { name: "CUET UG", purpose: "Central University admissions", level: "12th any stream", attempts: "Once/year", syllabus: "Domain subjects + General Test + Language", prepTime: "6–12 months" },
  { name: "GATE", purpose: "M.Tech / PSU jobs / research", level: "B.Tech final year+", attempts: "Once/year", syllabus: "Core branch + Engineering Maths + Aptitude", prepTime: "12 months" },
  { name: "CAT", purpose: "MBA at IIMs and top B-schools", level: "Graduate", attempts: "Once/year", syllabus: "VARC + DILR + Quant", prepTime: "9–12 months" },
  { name: "UPSC CSE", purpose: "IAS / IPS / IFS", level: "Graduate", attempts: "Once/year", syllabus: "GS Prelims + Mains + Optional + Interview", prepTime: "12–24 months" },
  { name: "CLAT", purpose: "Law admissions to NLUs", level: "12th any stream", attempts: "Once/year", syllabus: "English, GK, Legal reasoning, Logic, Quant", prepTime: "12 months" },
  { name: "NDA", purpose: "Defence forces officer entry", level: "12th PCM (Air/Navy)", attempts: "Twice/year", syllabus: "Mathematics + General Ability Test", prepTime: "12 months" },
  { name: "SSC CGL", purpose: "Central government jobs", level: "Graduate", attempts: "Once/year", syllabus: "Reasoning + Quant + English + GK", prepTime: "6–12 months" },
];

const STRATEGY = [
  {
    icon: Target,
    title: "Pick one exam as your anchor",
    body: "Most successful students go deep on one exam and treat others as fallback. Trying to crack JEE, BITSAT and EAMCET equally usually leads to average results in all three. Anchor on the highest-priority exam, then use the others as natural practice.",
  },
  {
    icon: CalendarClock,
    title: "Reverse-engineer the timeline",
    body: "Mark the exam date, then count backwards: 2 months full revision and mocks, 4 months problem solving, the rest for syllabus coverage. If your math doesn't fit, you either need to start earlier or trim scope honestly.",
  },
  {
    icon: FileText,
    title: "Mocks early, mocks often",
    body: "Don't wait until you 'finish the syllabus' to attempt mocks. Start one mock per fortnight after the first three months — even with weak topics. Mocks are how you learn to manage time and pressure, which textbooks can't teach.",
  },
];

function CompetitiveExamsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Competitive Exams"
        title="Every major Indian exam, explained"
        description="From JEE to UPSC — eligibility, syllabus highlights, prep timelines, and your ideal starting point for each."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => (
            <article key={e.name} className="glass flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px]">
                  {e.attempts}
                </span>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold">{e.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{e.purpose}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent">
                <GraduationCap className="h-3 w-3" /> {e.level}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p><span className="font-semibold text-foreground">Syllabus: </span>{e.syllabus}</p>
                <p><span className="font-semibold text-foreground">Ideal prep: </span>{e.prepTime}</p>
              </div>
              {e.link && (
                <Link to={e.link} className="mt-auto">
                  <Button size="sm" variant="ghost" className="mt-3 px-0 text-accent hover:bg-transparent">
                    Open guide <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Strategy */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">A sane strategy for any competitive exam</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These three ideas apply whether you're cracking JEE, NEET, GATE, CAT or UPSC.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {STRATEGY.map((s) => (
            <article key={s.title} className="glass rounded-2xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="glass-strong rounded-2xl p-6 text-center lg:p-10">
          <FileText className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-2 font-display text-xl font-bold lg:text-2xl">
            Need a personalised study plan?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell our AI planner your target exam and current level — get a custom week-by-week timetable in seconds.
          </p>
          <Link to="/tools">
            <Button className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow">
              Open AI Planner <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
