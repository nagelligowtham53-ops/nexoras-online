import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CampaignAdminData, PublicCampaign, ReferralDashboard } from "@/lib/campaign";
import { normalizeReferralCode } from "@/lib/campaign";

const mapCampaign = (row: Record<string, unknown>): PublicCampaign => ({
  id: String(row.id), slug: String(row.slug), name: String(row.name), timezone: String(row.timezone),
  startsAt: String(row.starts_at), endsAt: String(row.ends_at), status: String(row.status) as PublicCampaign["status"],
  referralEnabled: Boolean(row.referral_enabled), themeEnabled: Boolean(row.theme_enabled),
  referrerReward: Number(row.referrer_reward), referredReward: Number(row.referred_reward),
  bannerTitle: String(row.banner_title), bannerMessage: String(row.banner_message), bannerDeadline: String(row.banner_deadline),
});

async function requireAdmin(context: { supabase: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || data !== true) throw new Error("Administrator access required");
}

export const getActiveCampaign = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("active_campaign");
  if (error) throw new Error("Campaign information is temporarily unavailable");
  const row = Array.isArray(data) ? data[0] : null;
  return row ? mapCampaign(row as Record<string, unknown>) : null;
});

export const validateReferralCode = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ code: z.string().max(32) }).parse(input))
  .handler(async ({ data }) => {
    const code = normalizeReferralCode(data.code);
    if (!code) return { valid: false, campaignName: null, referrerReward: 0, referredReward: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("validate_referral_code", { p_code: code });
    if (error) return { valid: false, campaignName: null, referrerReward: 0, referredReward: 0 };
    const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : undefined;
    return {
      valid: Boolean(row?.valid), campaignName: row?.campaign_name ? String(row.campaign_name) : null,
      referrerReward: Number(row?.referrer_reward ?? 0), referredReward: Number(row?.referred_reward ?? 0),
    };
  });

export const getReferralDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralDashboard> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("finalize_referral_for_user", { p_user_id: context.userId });

    let { data: codeRow } = await supabaseAdmin.from("referral_codes").select("id,code").eq("user_id", context.userId).maybeSingle();
    if (!codeRow) {
      for (let attempt = 0; attempt < 5 && !codeRow; attempt += 1) {
        const code = `NEX-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
        const { data: inserted, error } = await supabaseAdmin.from("referral_codes").insert({ user_id: context.userId, code }).select("id,code").maybeSingle();
        if (!error) codeRow = inserted;
      }
      const { data: campaignRows } = await supabaseAdmin.rpc("active_campaign");
      const campaign = Array.isArray(campaignRows) ? campaignRows[0] : null;
      if (campaign) await supabaseAdmin.from("campaign_events").insert({ campaign_id: campaign.id, user_id: context.userId, event_type: "code_generated" });
    }
    if (!codeRow) throw new Error("Could not create your referral code");

    const [{ data: balance }, { data: earned }, { data: rows }] = await Promise.all([
      supabaseAdmin.from("credit_balances").select("balance").eq("user_id", context.userId).maybeSingle(),
      supabaseAdmin.from("credit_transactions").select("amount").eq("user_id", context.userId).eq("transaction_type", "referral_reward").eq("status", "confirmed"),
      supabaseAdmin.from("referrals").select("id,status,created_at,successful_at,campaigns(referrer_reward)").eq("referrer_user_id", context.userId).order("created_at", { ascending: false }).limit(50),
    ]);
    const history = (rows ?? []).map((row: any) => ({
      id: row.id, status: row.status, reward: row.status === "successful" ? Number(row.campaigns?.referrer_reward ?? 0) : null,
      createdAt: row.created_at, successfulAt: row.successful_at,
    }));
    return {
      code: codeRow.code, balance: Number(balance?.balance ?? 0),
      creditsEarned: (earned ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0),
      successful: history.filter((item) => item.status === "successful").length,
      pending: history.filter((item) => item.status === "pending").length,
      history,
    };
  });

export const recordReferralShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.rpc("active_campaign");
    const campaign = Array.isArray(rows) ? rows[0] : null;
    if (campaign) await supabaseAdmin.from("campaign_events").insert({ campaign_id: campaign.id, user_id: context.userId, event_type: "referral_shared" });
    return { ok: true };
  });

export const getCampaignAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CampaignAdminData> => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign, error } = await supabaseAdmin.from("campaigns").select("*").eq("slug", "ganesh-utsav-2026").single();
    if (error || !campaign) throw new Error("Campaign not found");
    const [{ count: generatedCodes }, { count: shares }, { data: referrals }, { data: credits }, { data: events }] = await Promise.all([
      supabaseAdmin.from("campaign_events").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("event_type", "code_generated"),
      supabaseAdmin.from("campaign_events").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).eq("event_type", "referral_shared"),
      supabaseAdmin.from("referrals").select("status,created_at,successful_at").eq("campaign_id", campaign.id),
      supabaseAdmin.from("credit_transactions").select("amount").in("transaction_type", ["referral_reward", "referral_bonus"]).eq("status", "confirmed"),
      supabaseAdmin.from("campaign_events").select("user_id").eq("campaign_id", campaign.id),
    ]);
    const refRows = referrals ?? [];
    const dailyMap = new Map<string, { signups: number; successful: number }>();
    for (const row of refRows) {
      const date = String(row.created_at).slice(0, 10);
      const value = dailyMap.get(date) ?? { signups: 0, successful: 0 };
      value.signups += 1;
      if (row.status === "successful") value.successful += 1;
      dailyMap.set(date, value);
    }
    const successful = refRows.filter((row) => row.status === "successful").length;
    return {
      campaign: { ...mapCampaign({ ...campaign, status: !campaign.enabled ? "disabled" : Date.now() < Date.parse(campaign.starts_at) ? "scheduled" : Date.now() >= Date.parse(campaign.ends_at) ? "ended" : "active" }), enabled: campaign.enabled, eligibilityRules: campaign.eligibility_rules as CampaignAdminData["campaign"]["eligibilityRules"] },
      metrics: {
        generatedCodes: generatedCodes ?? 0, shares: shares ?? 0, signups: refRows.length, successful,
        pending: refRows.filter((row) => row.status === "pending").length,
        rejected: refRows.filter((row) => row.status === "rejected").length,
        creditsAwarded: (credits ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0),
        conversionRate: refRows.length ? Math.round((successful / refRows.length) * 1000) / 10 : 0,
        participants: new Set((events ?? []).map((event) => event.user_id).filter(Boolean)).size,
        daily: [...dailyMap.entries()].map(([date, value]) => ({ date, ...value })).sort((a, b) => a.date.localeCompare(b.date)),
      },
    };
  });

const updateSchema = z.object({
  id: z.string().uuid(), enabled: z.boolean(), referralEnabled: z.boolean(), themeEnabled: z.boolean(),
  startsAt: z.string().datetime(), endsAt: z.string().datetime(),
  referrerReward: z.number().int().min(0).max(1000), referredReward: z.number().int().min(0).max(1000),
  bannerTitle: z.string().min(1).max(160), bannerMessage: z.string().min(1).max(500), bannerDeadline: z.string().min(1).max(160),
  eligibilityRules: z.object({ require_email_verification: z.boolean(), max_successful_per_referrer: z.number().int().min(1).max(10000), max_successful_per_referrer_per_day: z.number().int().min(1).max(1000) }),
}).refine((data) => Date.parse(data.endsAt) > Date.parse(data.startsAt), { message: "End date must be after start date" });

export const updateCampaignAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("campaigns").update({ enabled: data.enabled, referral_enabled: data.referralEnabled, theme_enabled: data.themeEnabled, starts_at: data.startsAt, ends_at: data.endsAt, referrer_reward: data.referrerReward, referred_reward: data.referredReward, banner_title: data.bannerTitle, banner_message: data.bannerMessage, banner_deadline: data.bannerDeadline, eligibility_rules: data.eligibilityRules }).eq("id", data.id);
    if (error) throw new Error("Campaign settings could not be saved");
    return { ok: true };
  });
