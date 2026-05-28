import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Check, Sparkles, ShieldCheck, Wallet, Repeat, X as XIcon, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIST, fmtINR } from "@/lib/billing-mock";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nexoras Pro Plans with Monthly Auto-Pay" },
      { name: "description", content: "Choose a Nexoras Pro plan. ₹99/month, ₹83/month for 6 months, or ₹75/month for a year. Auto-pay via UPI, cards or wallets. Cancel anytime, no hidden fees." },
      { property: "og:title", content: "Nexoras Pro — Pricing" },
      { property: "og:description", content: "Premium AI tools, unlimited mocks and exam prep. Plans from ₹75/month with auto-pay." },
      { property: "og:url", content: "https://nexoras.online/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/pricing" }],
  }),
  component: Pricing,
});

const PRO_FEATURES = [
  "Unlimited mock tests (JEE / EAMCET / BITSAT)",
  "PYQs with full explanations",
  "AI Study Planner + adaptive schedule",
  "AI Mock Interviews (HR + technical)",
  "Voice interview practice",
  "50+ premium resume templates",
  "Productivity dashboard & analytics",
  "Priority email support",
];

const FREE_FEATURES = [
  "20 mock tests / month",
  "Basic AI tools",
  "10 resume templates",
  "All free educational content",
];

const COMPARE: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Mock tests", free: "20 / month", pro: "Unlimited" },
  { label: "Resume templates", free: "10", pro: "50+ premium" },
  { label: "AI Study Planner", free: false, pro: true },
  { label: "AI Mock Interviews", free: false, pro: true },
  { label: "PYQs with explanations", free: false, pro: true },
  { label: "Productivity dashboard", free: "Basic", pro: "Full analytics" },
  { label: "Voice interviewer", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

const FAQ = [
  { q: "How does auto-pay work?", a: "We use secure recurring auto-pay (UPI / cards / wallets). On the 6-month and yearly plans you're charged a small amount every month — not the full total upfront." },
  { q: "What happens if I cancel?", a: "Cancellation stops all future auto-pay deductions immediately. Already-paid months are non-refundable, but you keep Pro access until the end of the current billing cycle." },
  { q: "Are there any cancellation fees?", a: "No. Cancel anytime, free of charge, from your billing dashboard." },
  { q: "Which payment methods are supported?", a: "UPI, PhonePe, Google Pay, Paytm, all major debit and credit cards, and net banking." },
  { q: "Will my price change later?", a: "No. The price you sign up at is locked for the entire plan duration." },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />;
  if (v === false) return <XIcon className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />;
  return <span className="text-sm">{v}</span>;
}

function Pricing() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Nexoras Pro"
        title="One platform. Every exam. Auto-pay simple."
        description="Unlock unlimited mock tests, AI mentors, premium prep and resume tools. Pay monthly — even on long-term plans. Cancel anytime."
      />

      {/* Free vs Pro top banner */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Free card */}
          <article className="glass relative overflow-hidden rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary/70 text-accent">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-semibold">Starter</h2>
              <span className="ml-auto rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Free forever</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">Free</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">A real taste of Nexoras — enough to crack your weekly goals.</p>
            <ul className="mt-5 space-y-2 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="mt-6 w-full">Continue free</Button>
            </Link>
          </article>

          {/* Pro plans grid */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-accent" />
              <h2 className="font-display text-lg font-semibold">Nexoras Pro</h2>
              <span className="rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">Recurring auto-pay</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLAN_LIST.map((p) => (
                <article
                  key={p.id}
                  className={`relative rounded-2xl p-5 transition ${
                    p.highlight ? "glass-strong shadow-glow ring-1 ring-accent/40" : "glass"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
                      {p.badge}
                    </span>
                  )}
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-gradient">{p.perMonthLabel}</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                  {p.totalCycles ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total {fmtINR(p.totalPrice)} over {p.totalCycles} months
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Billed monthly</p>
                  )}
                  {p.savePct ? (
                    <span className="mt-2 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Save {p.savePct}%
                    </span>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">{p.billedAs}</p>
                  <Link to="/checkout/$plan" params={{ plan: p.id }}>
                    <Button
                      className={`mt-4 w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground shadow-glow" : ""}`}
                      variant={p.highlight ? "default" : "outline"}
                    >
                      {p.highlight && <Sparkles className="h-4 w-4" />}
                      Get {p.name}
                    </Button>
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              All Pro plans include everything below. Cancel future auto-pay anytime from your billing dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Pro feature grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Everything in Nexoras Pro</h2>
        <p className="mt-1 text-sm text-muted-foreground">One subscription, every premium tool unlocked.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="glass flex items-start gap-3 rounded-xl p-4">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Secure auto-pay", d: "Bank-grade encryption via Razorpay." },
            { icon: Repeat, t: "Cancel anytime", d: "Stops future auto-pay. No fees." },
            { icon: Wallet, t: "UPI / Cards / Wallets", d: "PhonePe, GPay, Paytm, Visa, Mastercard." },
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
        <h2 className="font-display text-2xl font-bold">Free vs Pro</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 text-center font-semibold">Starter</th>
                <th className="px-4 py-3 text-center font-semibold text-accent">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-secondary/20" : ""}>
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 text-center"><Cell v={row.free} /></td>
                  <td className="px-4 py-3 text-center"><Cell v={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 lg:px-8">
        <h2 className="font-display text-2xl font-bold">Billing FAQ</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="glass group rounded-xl p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold marker:hidden">
                {f.q}
                <Zap className="h-4 w-4 text-accent transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
