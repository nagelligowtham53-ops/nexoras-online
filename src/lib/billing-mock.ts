// Dummy billing/subscription store backed by localStorage.
// Replace with real Razorpay subscription IDs and server state later.

export type PlanId = "monthly" | "six_month" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Total commitment, in INR */
  totalPrice: number;
  /** Recurring monthly auto-pay amount, in INR */
  monthlyAmount: number;
  /** Number of monthly billing cycles. null = open-ended */
  totalCycles: number | null;
  /** Effective per-month label shown on the card */
  perMonthLabel: string;
  /** Sub-line under price */
  billedAs: string;
  badge?: string;
  highlight?: boolean;
  savePct?: number;
};

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    name: "Monthly",
    tagline: "Maximum flexibility",
    totalPrice: 99,
    monthlyAmount: 99,
    totalCycles: null,
    perMonthLabel: "₹99",
    billedAs: "Billed ₹99 every month. Cancel anytime.",
  },
  six_month: {
    id: "six_month",
    name: "6 Months",
    tagline: "Most chosen by students",
    totalPrice: 499,
    monthlyAmount: 83,
    totalCycles: 6,
    perMonthLabel: "₹83",
    billedAs: "Auto-pay ₹83/month for 6 months (₹499 total).",
    badge: "Popular",
    highlight: true,
    savePct: 16,
  },
  yearly: {
    id: "yearly",
    name: "Yearly",
    tagline: "Best value, exam-season ready",
    totalPrice: 899,
    monthlyAmount: 75,
    totalCycles: 12,
    perMonthLabel: "₹75",
    billedAs: "Auto-pay ~₹75/month for 12 months (₹899 total).",
    badge: "Best value",
    savePct: 24,
  },
};

export const PLAN_LIST: Plan[] = [PLANS.monthly, PLANS.six_month, PLANS.yearly];

export type Invoice = {
  id: string;
  number: string;
  date: string; // ISO
  amount: number;
  status: "paid" | "upcoming" | "failed";
  method: string;
};

export type Subscription = {
  planId: PlanId;
  status: "active" | "cancelled" | "expired";
  startedAt: string; // ISO
  /** ISO – next auto-pay date */
  nextBillingAt: string;
  /** how many cycles already paid */
  cyclesPaid: number;
  /** When cancelled: access remains valid until this ISO */
  accessUntil: string;
  /** Last 4 / UPI handle / wallet */
  method: string;
  invoices: Invoice[];
};

const KEY = "nexoras.subscription.v1";

function addMonthsIso(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function getSubscription(): Subscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Subscription) : null;
  } catch {
    return null;
  }
}

function save(sub: Subscription | null) {
  if (typeof window === "undefined") return;
  if (!sub) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(sub));
  window.dispatchEvent(new CustomEvent("nexoras:sub-change"));
}

function genInvoiceNumber(seq: number) {
  const yr = new Date().getFullYear();
  return `NEX-${yr}-${String(seq).padStart(5, "0")}`;
}

export function startSubscription(planId: PlanId, method: string): Subscription {
  const plan = PLANS[planId];
  const now = new Date().toISOString();
  const seq = Math.floor(1000 + Math.random() * 9000);
  const firstInvoice: Invoice = {
    id: crypto.randomUUID(),
    number: genInvoiceNumber(seq),
    date: now,
    amount: plan.monthlyAmount,
    status: "paid",
    method,
  };
  const sub: Subscription = {
    planId,
    status: "active",
    startedAt: now,
    nextBillingAt: addMonthsIso(now, 1),
    cyclesPaid: 1,
    accessUntil: addMonthsIso(now, 1),
    method,
    invoices: [firstInvoice],
  };
  save(sub);
  return sub;
}

export function cancelSubscription(): Subscription | null {
  const sub = getSubscription();
  if (!sub) return null;
  const updated: Subscription = {
    ...sub,
    status: "cancelled",
    // accessUntil = next billing date (current cycle end)
    accessUntil: sub.nextBillingAt,
  };
  save(updated);
  return updated;
}

export function resetSubscription() {
  save(null);
}

export function useSubscriptionStore() {
  // tiny subscribe helper for React via window event
  return {
    get: getSubscription,
    subscribe(cb: () => void) {
      const handler = () => cb();
      window.addEventListener("nexoras:sub-change", handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("nexoras:sub-change", handler);
        window.removeEventListener("storage", handler);
      };
    },
  };
}

export function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
