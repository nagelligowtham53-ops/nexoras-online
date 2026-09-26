import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Gift, Share2, Sparkles, Users, WalletCards, Clock3, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReferralDashboard, recordReferralShare } from "@/lib/campaign.functions";
import type { ReferralDashboard } from "@/lib/campaign";
import { useCampaign } from "@/components/campaign/CampaignProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/refer")({
  head: () => ({ meta: [
    { title: "Refer & Earn AI Credits — Nexoras" },
    { name: "description", content: "Invite friends to Nexoras during Ganesh Utsav 2026 and earn AI Credits after verified signups." },
    { property: "og:title", content: "Nexoras Ganesh Utsav Refer & Earn" },
    { property: "og:description", content: "Invite friends, learn together, and earn AI Credits during Ganesh Utsav 2026." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReferRoute,
});

function ReferRoute() {
  return <RequireAuth><ReferPage /></RequireAuth>;
}

function ReferPage() {
  const { campaign, active } = useCampaign();
  const fetchDashboard = useServerFn(getReferralDashboard);
  const trackShare = useServerFn(recordReferralShare);
  const [data, setData] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const referralUrl = useMemo(() => data ? `${window.location.origin}/signup?ref=${encodeURIComponent(data.code)}` : "", [data]);

  useEffect(() => {
    fetchDashboard().then(setData).catch((error) => toast.error(error instanceof Error ? error.message : "Referral details are unavailable")).finally(() => setLoading(false));
  }, [fetchDashboard]);

  async function share() {
    if (!referralUrl) return;
    const shareData = { title: "Join me on Nexoras", text: "Study smarter with Nexoras. Join through my Ganesh Utsav invitation and earn AI Credits after verification.", url: referralUrl };
    try {
      const usedNativeShare = typeof navigator.share === "function";
      if (usedNativeShare) await navigator.share(shareData);
      else await navigator.clipboard.writeText(referralUrl);
      await trackShare();
      toast.success(usedNativeShare ? "Invitation shared" : "Invitation link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share the invitation");
    }
  }

  async function copy() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Invitation link copied");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="campaign-refer-intro">
          <Badge className="campaign-badge border-0">🪔 Ganesh Utsav 2026</Badge>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Refer friends. Earn AI Credits.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Learn and celebrate together. Rewards are added automatically after a new user verifies their account.</p>
          {!active && <p className="mt-4 rounded-md border border-border bg-secondary/50 px-4 py-3 text-sm">{campaign?.status === "scheduled" ? "This campaign has not started yet." : "This campaign is no longer active. Your referral history remains available."}</p>}
        </div>

        {loading ? <div className="mt-10 h-52 animate-pulse rounded-lg bg-secondary/50" /> : data ? (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={WalletCards} label="AI Credit balance" value={data.balance} />
              <Metric icon={Gift} label="Credits earned" value={data.creditsEarned} />
              <Metric icon={CheckCircle2} label="Successful referrals" value={data.successful} />
              <Metric icon={Clock3} label="Pending verification" value={data.pending} />
            </div>

            <Card className="mt-6 border-campaign bg-card/80">
              <CardHeader><CardTitle>Your invitation link</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3 font-mono text-sm break-all">{referralUrl}</div>
                  <Button variant="outline" onClick={copy}><Copy className="h-4 w-4" /> Copy</Button>
                  <Button onClick={share} disabled={!active} className="campaign-cta"><Share2 className="h-4 w-4" /> Share</Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Your code: <strong className="text-foreground">{data.code}</strong>. Self-referrals, repeated accounts, and unverified signups do not qualify.</p>
              </CardContent>
            </Card>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <Card>
                <CardHeader><CardTitle>Referral activity</CardTitle></CardHeader>
                <CardContent>
                  {data.history.length ? <div className="divide-y divide-border">
                    {data.history.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"><Users className="h-4 w-4" /></span><div><p className="text-sm font-medium">Friend #{String(data.history.length - index).padStart(2, "0")}</p><p className="text-xs text-muted-foreground">Joined {new Date(item.createdAt).toLocaleDateString("en-IN")}</p></div></div>
                        <div className="text-right"><Badge variant={item.status === "successful" ? "default" : "secondary"}>{item.status === "successful" ? "Verified" : item.status}</Badge>{item.reward ? <p className="mt-1 text-xs text-muted-foreground">+{item.reward} credits</p> : null}</div>
                      </div>
                    ))}
                  </div> : <div className="py-10 text-center"><Users className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-medium">No invitations completed yet</p><p className="mt-1 text-sm text-muted-foreground">Share your link with friends to get started.</p></div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>How rewards work</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {[
                    ["1", "Share your link", "Send your personal Nexoras invitation to a friend."],
                    ["2", "They create an account", "The referral is recorded when they join through your link."],
                    ["3", "They verify their email", "After verification, rewards are issued automatically and only once."],
                  ].map(([step, title, copy]) => <div key={step} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy}</p></div></div>)}
                  <div className="rounded-md bg-secondary/60 p-4 text-sm"><Sparkles className="mb-2 h-4 w-4 text-campaign-gold" /><strong>{campaign?.referrerReward ?? 8} credits</strong> for you and <strong>{campaign?.referredReward ?? 5} credits</strong> for your friend.</div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : <Card className="mt-10"><CardContent className="py-12 text-center"><p className="font-medium">Referral details could not be loaded.</p><Link to="/dashboard" className="mt-2 inline-block text-sm text-accent">Return to dashboard</Link></CardContent></Card>}
      </section>
    </PageShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: number }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary"><Icon className="h-5 w-5 text-campaign-gold" /></span><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}
