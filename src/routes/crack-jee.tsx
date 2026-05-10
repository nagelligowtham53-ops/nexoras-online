import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Atom, FlaskConical, Sigma, Calendar, BookOpen, Target, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/crack-jee")({
  head: () => ({
    meta: [
      { title: "Crack JEE — Complete Preparation Guide | Nexoras" },
      { name: "description", content: "Complete JEE Main & Advanced preparation: roadmap, study plans (30/90/365 days), subject-wise strategy, books, PYQs and pitfalls to avoid." },
    ],
  }),
  component: CrackJEEPage,
});

const PLANS: Record<string, string[]> = {
  "30 Days": [
    "Day 1-3: Diagnostic mock test → identify weak chapters",
    "Day 4-15: Revise high-weightage chapters (Mech, Organic, Calculus)",
    "Day 16-25: PYQs (last 10 years) — daily 30 questions",
    "Day 26-28: 3 full-length mocks; analyse mistakes",
    "Day 29-30: Light revision + sleep + exam-day mindset",
  ],
  "90 Days": [
    "Weeks 1-2: Build a chapter-wise revision schedule",
    "Weeks 3-6: Complete NCERT + class notes for all 3 subjects",
    "Weeks 7-9: PYQ + topic tests every weekend",
    "Weeks 10-12: 12 full mocks (alternate JEE Main / Advanced)",
    "Final 5 days: Formula sheet + mental rehearsal only",
  ],
  "1 Year": [
    "Months 1-4: Cover full syllabus once, chapter tests weekly",
    "Months 5-7: Second revision + pick standard reference books",
    "Months 8-9: Begin full mocks, deep error analysis",
    "Months 10-11: PYQs + advanced-level problems daily",
    "Month 12: 20+ mocks + final revision",
  ],
  "2 Years": [
    "Year 1: Build foundation — NCERT + concepts + class 11 mastery",
    "Year 2 H1: Class 12 syllabus + integrated revision",
    "Year 2 H2: 30+ full mocks, advanced problem-solving, JEE Advanced specific prep",
  ],
};

function CrackJEEPage() {
  const [plan, setPlan] = useState<keyof typeof PLANS>("90 Days");

  return (
    <PageShell>
      <PageHeader
        eyebrow="Crack JEE"
        title="Your complete JEE preparation playbook"
        description="JEE Main + Advanced — strategy, study plans, subject mastery, PYQs and pitfalls. Built with toppers' frameworks."
      />

      <section className="mx-auto max-w-7xl space-y-12 px-4 py-10 lg:px-8">
        {/* What is JEE */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card icon={Target} title="What is JEE Main?" desc="National-level entrance for NITs, IIITs, GFTIs and B.Tech admissions across India. Conducted twice a year (Jan + April) by NTA. Computer-based, MCQ + numerical." />
          <Card icon={Atom} title="What is JEE Advanced?" desc="The gateway to IITs. Only top 2.5 lakh JEE Main scorers can attempt it. Two papers, harder concepts, multi-correct + integer + paragraph types." />
          <Card icon={Lightbulb} title="Main vs Advanced" desc="Main tests speed + accuracy on standard problems. Advanced tests deep conceptual application + multi-step reasoning. Different mindset, same syllabus." />
        </div>

        {/* Study plans */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-2xl font-bold">Pick your study plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose the timeline that matches your situation.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(PLANS).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p as keyof typeof PLANS)}
                className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                  plan === p
                    ? "border-accent/60 bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border-border bg-background/40 hover:border-accent/40"
                }`}
              >
                <Calendar className="mr-1 inline h-3.5 w-3.5" /> {p}
              </button>
            ))}
          </div>
          <ol className="mt-6 space-y-2">
            {PLANS[plan].map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border bg-background/40 p-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Subject strategy */}
        <div>
          <h2 className="font-display text-2xl font-bold">Subject-wise strategy</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Subject icon={Atom} name="Physics" tips={[
              "Master HC Verma + DC Pandey",
              "Mechanics + Electromagnetism = 50% weight",
              "Solve numericals, not just theory",
              "Modern physics is high-yield, easy",
              "Diagram every problem before solving",
            ]} books={["HC Verma Vol 1+2", "DC Pandey", "Irodov (Advanced)"]} />
            <Subject icon={FlaskConical} name="Chemistry" tips={[
              "NCERT is BIBLE for Inorganic",
              "Organic = mechanisms, not memorisation",
              "Physical = practice numericals daily",
              "Make a reactions cheatsheet",
              "Revise NCERT 3 times before exam",
            ]} books={["NCERT (must)", "MS Chouhan (Organic)", "OP Tandon"]} />
            <Subject icon={Sigma} name="Mathematics" tips={[
              "Calculus + Coordinate = 40% weight",
              "Speed comes from pattern recognition",
              "Keep a 'mistake notebook'",
              "Algebra builds your foundation",
              "Solve 20+ problems daily — no skipping",
            ]} books={["Cengage series", "Arihant Skills in Math", "RD Sharma (basics)"]} />
          </div>
        </div>

        {/* PYQ strategy */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-2xl font-bold">PYQ strategy (the secret weapon)</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Solve last 10-15 years of JEE Main + Advanced PYQs",
              "Pattern-match: ~30% of questions repeat in concept",
              "Time yourself — JEE Main = 1 min/question average",
              "Maintain a separate notebook for trick questions",
              "Re-attempt failed PYQs every 2 weeks",
              "Use NTA Abhyas app for free official mocks",
            ].map((s) => <li key={s} className="flex gap-2 text-sm"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{s}</li>)}
          </ul>
        </div>

        {/* Mistakes */}
        <div className="glass rounded-2xl border border-destructive/30 p-6">
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /><h2 className="font-display text-2xl font-bold">Mistakes to avoid</h2></div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "Hopping between too many books",
              "Skipping NCERT for Chemistry",
              "Ignoring previous year analysis",
              "Studying without timed practice",
              "Late-night cram, no sleep schedule",
              "Comparing yourself with peers daily",
              "Mock test without analysis = waste",
              "Solving only easy problems for ego",
            ].map((s) => <li key={s} className="flex gap-2 text-sm"><span className="text-destructive">✗</span> {s}</li>)}
          </ul>
        </div>

        {/* CTA */}
        <div className="glass-strong rounded-2xl p-6 text-center">
          <h3 className="font-display text-xl font-bold">Ready to put it into practice?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Take a real JEE-style mock test or grind topic-wise practice questions.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/mock-tests"><Button className="bg-gradient-primary text-primary-foreground shadow-glow">Take a Mock Test <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/practice"><Button variant="outline">Practice Questions</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Card({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow"><Icon className="h-5 w-5 text-primary-foreground" /></div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Subject({ icon: Icon, name, tips, books }: { icon: React.ComponentType<{ className?: string }>; name: string; tips: string[]; books: string[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-accent" /><h3 className="font-display text-lg font-semibold">{name}</h3></div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {tips.map((t) => <li key={t} className="flex gap-2"><span className="text-accent">→</span> {t}</li>)}
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended books</p>
        <p className="mt-1 text-xs">{books.join(" · ")}</p>
      </div>
    </div>
  );
}
