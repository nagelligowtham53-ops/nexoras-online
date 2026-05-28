import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Lock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "./PageShell";
import { RequireAuth } from "./RequireAuth";
import { usePremium } from "@/lib/premium";

export function PremiumGate({ feature, children }: { feature: string; children: ReactNode }) {
  return (
    <RequireAuth>
      <PremiumGateInner feature={feature}>{children}</PremiumGateInner>
    </RequireAuth>
  );
}

function PremiumGateInner({ feature, children }: { feature: string; children: ReactNode }) {
  const { loading, isPremium, isAdmin } = usePremium();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <>
        {isAdmin && <DemoBanner />}
        {children}
      </>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nexoras Pro"
        title={`${feature} is a Premium feature`}
        description="Unlock the full Nexoras experience with a Pro subscription. Cancel anytime."
      />
      <section className="mx-auto max-w-2xl px-4 pb-20">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Upgrade to Nexoras Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Plans start at ₹75/month. Unlock unlimited mock tests, AI interviews,
            premium resume templates, study planner and career roadmaps.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/pricing">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Crown className="h-4 w-4" /> See plans
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-accent/30 bg-gradient-to-r from-accent/15 via-primary/10 to-accent/15">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">Premium Demo Mode</span>
        <span className="text-muted-foreground">
          — full access via admin/test account. Live payments not required.
        </span>
      </div>
    </div>
  );
}
