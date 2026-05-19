import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Check, Sparkles, X, ShieldCheck, HeartHandshake, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nexoras Plans for Students & Campuses" },
      { name: "description", content: "Transparent, student-first pricing for Nexoras. Start free with our AI study planner, calculators, resume builder and mock tests. Upgrade to Pro for unlimited usage or Campus for institutions." },
      { property: "og:title", content: "Pricing — Nexoras" },
      { property: "og:description", content: "Simple plans for students and campuses. Start free, upgrade when you're ready, cancel anytime." },
      { property: "og:url", content: "https://nexoras.online/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/pricing" }],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "For students getting started with AI-powered studying.",
    features: [
      "AI study planner (5 plans / month)",
      "All smart calculators (CGPA, attendance, %)",
      "1 ATS-friendly resume template",
      "10 practice questions / day",
      "Community access",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹199",
    suffix: "/mo",
    desc: "For serious students preparing for exams or placements.",
    features: [
      "Unlimited AI study plans",
      "All 12+ resume templates",
      "Unlimited mock interviews (HR + technical)",
      "Full JEE / EAMCET / BITSAT mock tests",
      "Personalised career roadmaps",
      "Priority email support",
    ],
    highlight: true,
  },
  {
    name: "Campus",
    price: "Custom",
    desc: "For colleges, coaching institutes and student batches.",
    features: [
      "Everything in Pro",
      "Bulk seats with admin dashboard",
      "Batch-level analytics & reports",
      "Branded learning hub",
      "Dedicated success manager",
      "Custom onboarding & training",
    ],
    highlight: false,
  },
];

const COMPARE: { label: string; starter: string | boolean; pro: string | boolean; campus: string | boolean }[] = [
  { label: "AI study plans", starter: "5 / mo", pro: "Unlimited", campus: "Unlimited" },
  { label: "Mock interviews", starter: false, pro: "Unlimited", campus: "Unlimited" },
  { label: "Resume templates", starter: "1", pro: "12+", campus: "12+ + branded" },
  { label: "Mock tests (JEE/EAMCET/BITSAT)", starter: "1 free / week", pro: "Unlimited", campus: "Unlimited" },
  { label: "Career roadmaps", starter: false, pro: true, campus: true },
  { label: "Priority support", starter: false, pro: true, campus: true },
  { label: "Admin dashboard", starter: false, pro: false, campus: true },
  { label: "Custom branding", starter: false, pro: false, campus: true },
];

const FAQ = [
  {
    q: "Is Nexoras really free to start?",
    a: "Yes. The Starter plan is free forever and includes the AI study planner, all calculators, one resume template, and daily practice. No credit card required to sign up.",
  },
  {
    q: "Can I cancel my Pro plan anytime?",
    a: "Absolutely. You can cancel from your profile in one click. You keep Pro access until the end of the current billing cycle — no questions asked.",
  },
  {
    q: "Do you offer student discounts?",
    a: "Pro is already priced for students at ₹199/month — about the cost of two coffees. For verified school and college batches we offer up to 60% off through the Campus plan.",
  },
  {
    q: "How does the Campus plan work?",
    a: "Campus is for institutions buying 25+ seats. We onboard your batch, provide an admin dashboard with progress analytics, and can co-brand the learning hub. Contact us for a quote.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, all major Indian credit and debit cards, net banking, and popular wallets. International cards are supported for users outside India.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're unhappy in the first 7 days of a new Pro subscription, email us and we'll refund you in full — no questions asked.",
  },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />;
  if (v === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />;
  return <span className="text-sm">{v}</span>;
}

function Pricing() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Pricing"
        title="Simple plans, built for students"
        description="Start free. Upgrade when you're ready. Cancel anytime. No hidden fees, no surprises."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <article key={p.name} className={`relative rounded-2xl p-7 ${p.highlight ? "glass-strong shadow-glow" : "glass"}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-xl font-semibold">{p.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-gradient">{p.price}</span>
                {p.suffix && <span className="text-sm text-muted-foreground">{p.suffix}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={p.name === "Campus" ? "/contact" : "/signup"}>
                <Button className={`mt-6 w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground shadow-glow" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  {p.highlight && <Sparkles className="h-4 w-4" />}
                  {p.name === "Campus" ? "Talk to sales" : `Get ${p.name}`}
                </Button>
              </Link>
            </article>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Secure payments", d: "256-bit encryption. Stripe & Razorpay." },
            { icon: HeartHandshake, t: "7-day refund", d: "Not happy? Get a full refund, no questions." },
            { icon: Wallet, t: "Cancel anytime", d: "One-click cancellation from your profile." },
          ].map((x) => (
            <div key={x.t} className="glass flex items-start gap-3 rounded-xl p-4">
              <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <x.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{x.t}</p>
                <p className="text-xs text-muted-foreground">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Compare plans in detail</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every feature, side by side.</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 text-center font-semibold">Starter</th>
                <th className="px-4 py-3 text-center font-semibold text-accent">Pro</th>
                <th className="px-4 py-3 text-center font-semibold">Campus</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-secondary/20" : ""}>
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 text-center"><Cell v={row.starter} /></td>
                  <td className="px-4 py-3 text-center"><Cell v={row.pro} /></td>
                  <td className="px-4 py-3 text-center"><Cell v={row.campus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="glass group rounded-xl p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
