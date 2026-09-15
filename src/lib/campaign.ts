export type CampaignStatus = "scheduled" | "active" | "ended" | "disabled";

export type PublicCampaign = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  status: CampaignStatus;
  referralEnabled: boolean;
  themeEnabled: boolean;
  referrerReward: number;
  referredReward: number;
  bannerTitle: string;
  bannerMessage: string;
  bannerDeadline: string;
};

export type ReferralHistoryItem = {
  id: string;
  status: "pending" | "successful" | "rejected" | "reversed";
  reward: number | null;
  createdAt: string;
  successfulAt: string | null;
};

export type ReferralDashboard = {
  code: string;
  balance: number;
  creditsEarned: number;
  successful: number;
  pending: number;
  history: ReferralHistoryItem[];
};

export type CampaignAdminMetrics = {
  generatedCodes: number;
  shares: number;
  signups: number;
  successful: number;
  pending: number;
  rejected: number;
  creditsAwarded: number;
  conversionRate: number;
  participants: number;
  daily: Array<{ date: string; signups: number; successful: number }>;
};

export type CampaignAdminData = {
  campaign: PublicCampaign & {
    enabled: boolean;
    eligibilityRules: {
      require_email_verification: boolean;
      max_successful_per_referrer: number;
      max_successful_per_referrer_per_day: number;
    };
  };
  metrics: CampaignAdminMetrics;
};

export const DISTRACTION_FREE_PATHS = [
  "/mock-tests", "/practice", "/custom-practice", "/practice-history",
  "/competitive-exams", "/crack-jee", "/mock-interview", "/coding",
  "/problems", "/results",
];

export function isDistractionFreePath(pathname: string) {
  return DISTRACTION_FREE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

export function campaignStatus(now: Date, startsAt: Date, endsAt: Date, enabled: boolean): CampaignStatus {
  if (!enabled) return "disabled";
  if (now < startsAt) return "scheduled";
  if (now >= endsAt) return "ended";
  return "active";
}
