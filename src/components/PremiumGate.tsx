import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { RequireAuth } from "./RequireAuth";

// Nexoras is fully free. PremiumGate now only enforces authentication.
// We keep the component so existing routes don't need refactoring.
export function PremiumGate({ children }: { feature?: string; children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export function DemoBanner() {
  return (
    <div className="border-b border-accent/30 bg-gradient-to-r from-accent/15 via-primary/10 to-accent/15">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">Nexoras is 100% free</span>
        <span className="text-muted-foreground">— every exam, interview, planner & AI tool is unlocked for all users.</span>
      </div>
    </div>
  );
}
