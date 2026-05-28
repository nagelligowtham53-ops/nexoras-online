import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Calendar, Receipt, ArrowRight } from "lucide-react";
import { PLANS, getSubscription, fmtDate, fmtINR, type Subscription } from "@/lib/billing-mock";

export const Route = createFileRoute("/payment-success")({
  head: () => ({ meta: [{ title: "Payment successful — Nexoras Pro" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <Success />
    </RequireAuth>
  ),
});

function Success() {
  const [sub, setSub] = useState<Subscription | null>(null);
  useEffect(() => { setSub(getSubscription()); }, []);

  const plan = sub ? PLANS[sub.planId] : null;

  return (
    <PageShell>
      <div className="relative mx-auto max-w-2xl px-4 py-16 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-hero opacity-60" />
        <div className="glass-strong relative overflow-hidden rounded-3xl p-8 text-center shadow-elegant animate-fade-up">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow animate-pulse-glow">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">You're Pro now <span className="text-gradient">🎉</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Nexoras Pro subscription is active. Welcome to unlimited mocks, AI mentors and premium prep.
          </p>

          {sub && plan && (
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plan</p>
                <p className="mt-1 font-semibold">Nexoras Pro · {plan.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fmtINR(plan.monthlyAmount)} / month</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Next billing
                </p>
                <p className="mt-1 font-semibold">{fmtDate(sub.nextBillingAt)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Auto-pay via {sub.method}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3 w-3" /> First invoice
                </p>
                <p className="mt-1 font-mono text-sm">{sub.invoices[0]?.number}</p>
                <Link
                  to="/invoice/$id"
                  params={{ id: sub.invoices[0]?.id ?? "" }}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  View invoice <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/dashboard">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow w-full sm:w-auto">
                <Sparkles className="h-4 w-4" /> Go to dashboard
              </Button>
            </Link>
            <Link to="/billing">
              <Button variant="outline" className="w-full sm:w-auto">Manage subscription</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { t: "Unlimited mocks", d: "JEE, EAMCET, BITSAT" },
            { t: "AI mentors", d: "Plans, interviews, voice" },
            { t: "Premium resumes", d: "50+ ATS-ready templates" },
          ].map((b) => (
            <div key={b.t} className="glass rounded-xl p-4 text-center">
              <p className="text-sm font-semibold">{b.t}</p>
              <p className="text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
