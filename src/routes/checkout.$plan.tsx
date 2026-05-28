import { createFileRoute, Link, useNavigate, useParams, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, CreditCard, Smartphone, Wallet, Check, ArrowLeft, Sparkles } from "lucide-react";
import { PLANS, PlanId, fmtINR, startSubscription } from "@/lib/billing-mock";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$plan")({
  beforeLoad: ({ params }) => {
    if (!(params.plan in PLANS)) throw redirect({ to: "/pricing" });
  },
  head: () => ({ meta: [{ title: "Checkout — Nexoras Pro" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});

type Method = "upi" | "card" | "wallet" | "netbanking";

const METHODS: { id: Method; label: string; icon: typeof Smartphone; sub: string }[] = [
  { id: "upi", label: "UPI", icon: Smartphone, sub: "PhonePe · GPay · Paytm · BHIM" },
  { id: "card", label: "Card", icon: CreditCard, sub: "Debit & credit. Visa, Mastercard, RuPay" },
  { id: "wallet", label: "Wallet", icon: Wallet, sub: "Paytm, Mobikwik, Amazon Pay" },
  { id: "netbanking", label: "Netbanking", icon: ShieldCheck, sub: "All major Indian banks" },
];

function Checkout() {
  const { plan: planId } = useParams({ from: "/checkout/$plan" });
  const plan = PLANS[planId as PlanId];
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("upi");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    // Simulate gateway
    await new Promise((r) => setTimeout(r, 1400));
    const methodLabel =
      method === "upi" ? `UPI · ${upi || "user@upi"}` :
      method === "card" ? `Card · •••• ${card.number.slice(-4) || "4242"}` :
      method === "wallet" ? "Paytm Wallet" :
      "Netbanking · HDFC";
    startSubscription(plan.id, methodLabel);
    toast.success("Subscription activated");
    setLoading(false);
    navigate({ to: "/payment-success" });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <Link to="/pricing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold">Complete your subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure recurring auto-pay. Cancel anytime from your billing dashboard.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Payment method */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">Payment method</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              We'll set up auto-pay for {fmtINR(plan.monthlyAmount)} every month
              {plan.totalCycles ? ` for ${plan.totalCycles} months.` : "."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {METHODS.map((m) => {
                const active = m.id === method;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      active ? "border-accent bg-secondary/70 shadow-glow" : "border-border bg-background/30 hover:bg-secondary/40"
                    }`}
                  >
                    <span className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-accent"}`}>
                      <m.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{m.sub}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>

            {/* Method-specific inputs */}
            <div className="mt-5">
              {method === "upi" && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">UPI ID</label>
                  <input
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="yourname@upi"
                    className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    You'll receive an auto-pay mandate request in your UPI app.
                  </p>
                </div>
              )}
              {method === "card" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Card number</label>
                    <input
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                      placeholder="4242 4242 4242 4242"
                      className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Name on card</label>
                    <input
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      placeholder="As printed on card"
                      className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Expiry</label>
                    <input
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      placeholder="MM/YY"
                      className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">CVC</label>
                    <input
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                      placeholder="123"
                      className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
              {method === "wallet" && (
                <p className="text-sm text-muted-foreground">You'll be redirected to your wallet to approve the auto-pay mandate.</p>
              )}
              {method === "netbanking" && (
                <p className="text-sm text-muted-foreground">Choose your bank on the next screen to set up the e-mandate.</p>
              )}
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
              <span>
                This is a demo checkout. No real payment is processed and no card or UPI data leaves your browser.
              </span>
            </div>
          </section>

          {/* Order summary */}
          <aside className="glass-strong h-fit rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Order summary</h3>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
              <p className="text-sm font-semibold">Nexoras Pro · {plan.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.billedAs}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-gradient">{plan.perMonthLabel}</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">First payment today</dt>
                <dd className="font-semibold">{fmtINR(plan.monthlyAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Recurring monthly</dt>
                <dd>{fmtINR(plan.monthlyAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Billing cycles</dt>
                <dd>{plan.totalCycles ?? "Open-ended"}</dd>
              </div>
              {plan.totalCycles && (
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-muted-foreground">Total commitment</dt>
                  <dd className="font-semibold">{fmtINR(plan.totalPrice)}</dd>
                </div>
              )}
            </dl>

            <Button
              onClick={handlePay}
              disabled={loading}
              className="mt-5 w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {loading ? "Setting up auto-pay…" : `Pay ${fmtINR(plan.monthlyAmount)} & activate`}
            </Button>

            <p className="mt-3 text-[11px] text-muted-foreground">
              By continuing you authorise Nexoras to charge {fmtINR(plan.monthlyAmount)} to your selected method every month
              {plan.totalCycles ? ` for ${plan.totalCycles} cycles` : ""}. Cancel anytime from billing settings.
            </p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
