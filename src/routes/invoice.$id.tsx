import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, CheckCircle2 } from "lucide-react";
import { PLANS, getSubscription, fmtDate, fmtINR, type Invoice, type Subscription } from "@/lib/billing-mock";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/invoice/$id")({
  head: () => ({ meta: [{ title: "Invoice — Nexoras" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <InvoiceView />
    </RequireAuth>
  ),
});

function InvoiceView() {
  const { id } = useParams({ from: "/invoice/$id" });
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  useEffect(() => { setSub(getSubscription()); }, []);

  const inv: Invoice | undefined = sub?.invoices.find((i) => i.id === id);

  if (!sub || !inv) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8">
          <h1 className="font-display text-2xl font-bold">Invoice not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This invoice doesn't exist or has been removed.</p>
          <Link to="/billing"><Button className="mt-6" variant="outline">Back to billing</Button></Link>
        </div>
      </PageShell>
    );
  }

  const plan = PLANS[sub.planId];
  const subtotal = inv.amount;
  const tax = Math.round(subtotal * 0.18);
  const base = subtotal - tax;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 print:py-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/billing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to billing
          </Link>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        <div className="glass-strong overflow-hidden rounded-2xl p-8 print:bg-white print:text-black print:shadow-none">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold">Nexoras</p>
                  <p className="text-[11px] text-muted-foreground">AI-powered learning platform</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="mt-1 font-mono text-sm font-semibold">{inv.number}</p>
              <span className="mt-2 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                {inv.status}
              </span>
            </div>
          </div>

          {/* Bill to / from */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Billed to</p>
              <p className="mt-1 font-semibold">{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="mt-1 font-semibold">Nexoras Technologies</p>
              <p className="text-xs text-muted-foreground">support@nexoras.online</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice date</p>
              <p className="mt-1">{fmtDate(inv.date)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment method</p>
              <p className="mt-1">{inv.method}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-semibold">Nexoras Pro · {plan.name}</p>
                    <p className="text-xs text-muted-foreground">Monthly subscription cycle</p>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtINR(base)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">GST (18%)</td>
                  <td className="px-4 py-3 text-right">{fmtINR(tax)}</td>
                </tr>
                <tr className="border-t border-border bg-secondary/30">
                  <td className="px-4 py-3 font-semibold">Total paid</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold text-gradient">{fmtINR(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground">
            This is a system-generated invoice. No signature is required. For billing queries write to{" "}
            <a className="text-accent hover:underline" href="mailto:support@nexoras.online">support@nexoras.online</a>.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
