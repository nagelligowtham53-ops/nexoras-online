// Premium / demo-mode access logic.
// Admins (email whitelist) get full premium access without payment.
// Other users need an active subscription (mock store).
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSubscription, type Subscription } from "./billing-mock";

export const ADMIN_EMAILS = [
  "nagelligowtham53@gmail.com",
];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function subActive(sub: Subscription | null) {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (sub.status === "cancelled") return new Date(sub.accessUntil) > new Date();
  return false;
}

export function usePremium() {
  const { user, loading } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(() =>
    typeof window !== "undefined" ? getSubscription() : null,
  );

  useEffect(() => {
    const handler = () => setSub(getSubscription());
    window.addEventListener("nexoras:sub-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nexoras:sub-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isAdmin = isAdminEmail(user?.email);
  const hasSub = subActive(sub);
  return {
    loading,
    user,
    isAdmin,
    hasSubscription: hasSub,
    isPremium: isAdmin || hasSub,
    reason: isAdmin ? ("admin" as const) : hasSub ? ("subscription" as const) : ("none" as const),
  };
}
