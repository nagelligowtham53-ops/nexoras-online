// Nexoras is now 100% free for all users.
// Every previously-gated feature is unlocked. PremiumGate still wraps routes
// (so we can re-introduce paywalls later if needed), but `isPremium` is always
// true. Admin email retained for legacy "demo banner" / future role gates.
import { useAuth } from "@/hooks/useAuth";

export const ADMIN_EMAILS = [
  "nagelligowtham53@gmail.com",
];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function usePremium() {
  const { user, loading } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  return {
    loading,
    user,
    isAdmin,
    hasSubscription: true,
    isPremium: true,
    reason: "free" as const,
  };
}
