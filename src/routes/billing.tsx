import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Crown, Calendar, CreditCard, Receipt, AlertTriangle, CheckCircle2, XCircle,
  Download, Sparkles, RefreshCw, ShieldCheck,
} from "lucide-react";
import {
  PLANS, useSubscriptionStore, cancelSubscription, fmtDate, fmtINR,
  type Subscription,
} from "@/lib/billing-mock";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Subscription — Nexoras" },
      { name: "description", content: "Manage your Nexoras Pro subscription, view invoices, update payment method or cancel auto-pay." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Billing />
    </RequireAuth>
  ),
});

function Billing() {
  const store = useSubscriptionStore();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setSub(store.get());
    return store.subscribe(() => setSub(store.get()));
  }, [store]);

  function handleCancel() {
    const updated = cancelSubscription();
    setSub(updated);
    setConfirmCancel(false);
    toast.success("Auto-pay cancelled. Access stays until cycle end.");
  }

  if (!sub) return <EmptyState />;

  const plan = PLANS[sub.planId];
  const isActive = sub.status === "active";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Billing"
        title="Subscription & Invoices"
        description="Manage your Nexoras Pro plan, payment method, and download invoices."
      />

      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        {/* Status banner */}
        {!isActive && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Auto-pay cancelled</p>
              <p className="text-xs text-muted-foreground">
                Future deductions are stopped. You keep Pro access until <strong>{fmtDate(sub.accessUntil)}</strong>.
              </p>
            </div>
            <Link to="/pricing"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Reactivate</Button></Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Current plan */}
          <section className="glass-strong rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
                  <Crown className="h-3 w-3" /> Nexoras Pro
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold">{plan.name} plan</h2>
                <p className="text-sm text-muted-foreground">{plan.billedAs}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold text-gradient">{plan.perMonthLabel}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat
                icon={Calendar}
                label={isActive ? "Next billing" : "Access until"}
                value={fmtDate(isActive ? sub.nextBillingAt : sub.accessUntil)}
              />
              <Stat
                icon={isActive ? CheckCircle2 : XCircle}
                label="Status"
                value={isActive ? "Active" : "Cancelled"}
                accent={isActive}
              />
              <Stat
                icon={RefreshCw}
                label="Cycles paid"
                value={`${sub.cyclesPaid}${plan.totalCycles ? ` / ${plan.totalCycles}` : ""}`}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/pricing">
                <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> Change plan</Button>
              </Link>
              <Button variant="outline" size="sm"><CreditCard className="h-4 w-4" /> Update payment method</Button>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmCancel(true)}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel subscription
                </Button>
              )}
            </div>
          </section>

          {/* Payment method side card */}
          <aside className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Payment method</h3>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
              <p className="text-sm font-semibold">{sub.method}</p>
              <p className="mt-1 text-xs text-muted-foreground">Auto-pay mandate active</p>
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-accent" />
              <span>Mandate secured by Razorpay. You can revoke anytime by cancelling the subscription.</span>
            </div>
          </aside>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Billing history</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Invoice</th>
                      <th className="px-4 py-3 text-left">Method</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sub.invoices.map((inv, i) => (
                      <tr key={inv.id} className={i % 2 ? "bg-secondary/20" : ""}>
                        <td className="px-4 py-3">{fmtDate(inv.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{inv.number}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.method}</td>
                        <td className="px-4 py-3 text-right font-semibold">{fmtINR(inv.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusPill status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/invoice/$id" params={{ id: inv.id }} className="text-xs text-accent hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sub.invoices.map((inv) => (
                  <div key={inv.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{inv.number}</p>
                        <p className="mt-1 font-display text-lg font-bold">{fmtINR(inv.amount)}</p>
                      </div>
                      <StatusPill status={inv.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{fmtDate(inv.date)} · {inv.method}</p>
                    <div className="mt-3 flex gap-2">
                      <Link to="/invoice/$id" params={{ id: inv.id }} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">View</Button>
                      </Link>
                      <Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-4">
              <div className="glass rounded-2xl p-6">
                {isActive ? (
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{fmtDate(sub.nextBillingAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        We'll auto-charge {fmtINR(plan.monthlyAmount)} to {sub.method}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming charges. Auto-pay is cancelled.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Cancel dialog */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">Cancel auto-pay?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Future monthly deductions stop immediately. You keep Pro access until{" "}
                  <strong className="text-foreground">{fmtDate(sub.nextBillingAt)}</strong>.
                  Already paid months are non-refundable. No cancellation fee.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmCancel(false)}>Keep subscription</Button>
              <Button className="flex-1 bg-destructive text-destructive-foreground hover:opacity-90" onClick={handleCancel}>
                Cancel auto-pay
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-1 font-display text-lg font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "paid" | "upcoming" | "failed" }) {
  const map = {
    paid: { label: "Paid", cls: "bg-accent/15 text-accent" },
    upcoming: { label: "Upcoming", cls: "bg-secondary/70 text-muted-foreground" },
    failed: { label: "Failed", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const s = map[status];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>{s.label}</span>;
}

function EmptyState() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
          <Receipt className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">No active subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You're on the free Starter plan. Upgrade to Nexoras Pro to unlock unlimited mocks, AI mentors and premium prep.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/pricing">
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> See Pro plans
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
