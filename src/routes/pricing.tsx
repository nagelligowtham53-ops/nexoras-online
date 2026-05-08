import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Nexoras" }, { name: "description", content: "Simple, student-friendly pricing." }] }),
  component: Pricing,
});

const plans = [
  { name: "Starter", price: "Free", desc: "For students getting started.", features: ["AI study planner (basic)", "All calculators", "1 resume template", "Community access"], highlight: false },
  { name: "Pro", price: "₹199", suffix: "/mo", desc: "For serious students.", features: ["Unlimited AI plans", "All resume templates", "Mock interviews (10/mo)", "Career roadmaps", "Priority support"], highlight: true },
  { name: "Campus", price: "Custom", desc: "For colleges & batches.", features: ["Everything in Pro", "Bulk seats & analytics", "Branded learning hub", "Dedicated success manager"], highlight: false },
];

function Pricing() {
  return (
    <PageShell>
      <PageHeader eyebrow="Pricing" title="Simple plans, made for students" description="Start free. Upgrade when you're ready. Cancel anytime." />
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-7 ${p.highlight ? "glass-strong shadow-glow" : "glass"}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">Most popular</span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-gradient">{p.price}</span>
                {p.suffix && <span className="text-sm text-muted-foreground">{p.suffix}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-accent" /><span>{f}</span></li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className={`mt-6 w-full ${p.highlight ? "bg-gradient-primary text-primary-foreground shadow-glow" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  {p.highlight && <Sparkles className="h-4 w-4" />} Get {p.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
