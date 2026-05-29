import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Gift, Rocket, BookOpen, Brain, ListChecks, Mic } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Nexoras is 100% Free — All Premium Features Unlocked" },
      { name: "description", content: "Nexoras is now completely free for every student. Unlimited mock tests, AI mock interviews (voice + text), career roadmaps, study planners, resume tools — no plans, no payments." },
      { property: "og:title", content: "Nexoras — Now Free for Everyone" },
      { property: "og:description", content: "Every premium feature is free. No subscriptions. No paywalls." },
      { property: "og:url", content: "https://nexoras.online/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/pricing" }],
  }),
  component: Pricing,
});

const ALL_FREE = [
  { icon: ListChecks, label: "Unlimited mock tests (JEE, NEET, GATE, CAT, UPSC, SAT, GRE, IELTS & more)" },
  { icon: Mic, label: "AI mock interviews — Technical, HR, Visa, Behavioral, Communication" },
  { icon: Brain, label: "AI study planner + adaptive schedule" },
  { icon: BookOpen, label: "PYQs with full explanations + practice questions" },
  { icon: Rocket, label: "Career roadmaps + engineering branch guides" },
  { icon: Sparkles, label: "50+ premium resume templates & ATS optimizer" },
];

function Pricing() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Big update"
        title="Nexoras is now 100% free"
        description="No subscriptions. No paywalls. Every tool, every mock test, every AI interview — unlocked for every student, forever."
      />

      <section className="mx-auto max-w-3xl px-4 pt-6 lg:px-8">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-8 text-center shadow-elegant">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
            Everything Pro. <span className="text-gradient">Zero rupees.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            We removed every paid plan. Your only job is to study — ours is to make the best
            preparation platform completely free for Indian and international students.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Sparkles className="h-4 w-4" /> Create free account
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">Go to dashboard</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">What you get — free</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ALL_FREE.map((f) => (
            <div key={f.label} className="glass flex items-start gap-3 rounded-xl p-4">
              <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <f.icon className="h-4 w-4" />
              </span>
              <span className="text-sm leading-relaxed">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-background/40 p-6">
          <h3 className="font-display text-lg font-semibold">Frequently asked</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold">Is there a catch?</p>
              <p className="mt-1 text-muted-foreground">No. No trials, no credit-card required, no hidden plans.</p>
            </div>
            <div>
              <p className="font-semibold">I already paid earlier — what happens?</p>
              <p className="mt-1 text-muted-foreground">All previous plans (₹79, ₹99, ₹499, ₹899) have been retired. Everyone now has full access.</p>
            </div>
            <div>
              <p className="font-semibold">Do I still need to sign in?</p>
              <p className="mt-1 text-muted-foreground">Yes — a free account keeps your progress, mock-test history and interview scores in sync.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Check className="h-4 w-4 text-accent" /> No payments
          <Check className="h-4 w-4 text-accent" /> No locked features
          <Check className="h-4 w-4 text-accent" /> Same premium experience
        </div>
      </section>
    </PageShell>
  );
}
