import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Coins, Share2, UserCheck, Users, RefreshCw, Save } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getCampaignAdmin, updateCampaignAdmin } from "@/lib/campaign.functions";
import type { CampaignAdminData } from "@/lib/campaign";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/campaign")({
  head: () => ({ meta: [
    { title: "Campaign Admin — Nexoras" },
    { name: "description", content: "Manage Nexoras campaigns and referral reward analytics." },
    { property: "og:title", content: "Campaign Admin — Nexoras" },
    { property: "og:description", content: "Manage Nexoras campaigns and referral rewards." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <RequireAuth><CampaignAdmin /></RequireAuth>,
});

type FormState = CampaignAdminData["campaign"];

function CampaignAdmin() {
  const load = useServerFn(getCampaignAdmin);
  const save = useServerFn(updateCampaignAdmin);
  const [data, setData] = useState<CampaignAdminData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true); setError(null);
    try { const result = await load(); setData(result); setForm(result.campaign); }
    catch (err) { setError(err instanceof Error ? err.message : "Campaign data is unavailable"); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      await save({ data: { id: form.id, enabled: form.enabled, referralEnabled: form.referralEnabled, themeEnabled: form.themeEnabled, startsAt: form.startsAt, endsAt: form.endsAt, referrerReward: form.referrerReward, referredReward: form.referredReward, bannerTitle: form.bannerTitle, bannerMessage: form.bannerMessage, bannerDeadline: form.bannerDeadline, eligibilityRules: form.eligibilityRules } });
      toast.success("Campaign settings saved"); await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Settings could not be saved"); setBusy(false); }
  }

  if (error) return <PageShell><section className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Campaign access unavailable</h1><p className="mt-3 text-muted-foreground">{error}</p></section></PageShell>;
  if (!data || !form) return <PageShell><div className="mx-auto max-w-7xl px-4 py-16"><div className="h-72 animate-pulse rounded-lg bg-secondary/50" /></div></PageShell>;

  const metrics = data.metrics;
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><Badge variant="outline">Administrator</Badge><h1 className="mt-3 text-4xl font-bold">Campaign control center</h1><p className="mt-2 text-muted-foreground">Manage timing, rewards, visibility, and referral limits.</p></div><Button variant="outline" onClick={refresh} disabled={busy}><RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh</Button></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Users} label="Referral signups" value={metrics.signups} />
          <Metric icon={UserCheck} label="Verified referrals" value={metrics.successful} />
          <Metric icon={Coins} label="Credits awarded" value={metrics.creditsAwarded} />
          <Metric icon={BarChart3} label="Conversion" value={`${metrics.conversionRate}%`} />
          <Metric icon={Share2} label="Tracked shares" value={metrics.shares} />
          <Metric icon={Users} label="Participants" value={metrics.participants} />
          <Metric icon={BarChart3} label="Pending" value={metrics.pending} />
          <Metric icon={BarChart3} label="Rejected" value={metrics.rejected} />
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <Card><CardHeader><CardTitle>Campaign settings</CardTitle></CardHeader><CardContent className="space-y-5">
            <Toggle label="Campaign enabled" checked={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} />
            <Toggle label="Referral rewards enabled" checked={form.referralEnabled} onChange={(referralEnabled) => setForm({ ...form, referralEnabled })} />
            <Toggle label="Festive theme enabled" checked={form.themeEnabled} onChange={(themeEnabled) => setForm({ ...form, themeEnabled })} />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Starts at"><Input type="datetime-local" value={toLocalInput(form.startsAt)} onChange={(event) => setForm({ ...form, startsAt: new Date(event.target.value).toISOString() })} /></Field><Field label="Ends at"><Input type="datetime-local" value={toLocalInput(form.endsAt)} onChange={(event) => setForm({ ...form, endsAt: new Date(event.target.value).toISOString() })} /></Field></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Referrer reward"><Input type="number" min={0} value={form.referrerReward} onChange={(event) => setForm({ ...form, referrerReward: Number(event.target.value) })} /></Field><Field label="New user reward"><Input type="number" min={0} value={form.referredReward} onChange={(event) => setForm({ ...form, referredReward: Number(event.target.value) })} /></Field></div>
            <Field label="Banner title"><Input value={form.bannerTitle} onChange={(event) => setForm({ ...form, bannerTitle: event.target.value })} /></Field>
            <Field label="Banner message"><Input value={form.bannerMessage} onChange={(event) => setForm({ ...form, bannerMessage: event.target.value })} /></Field>
            <Field label="Deadline text"><Input value={form.bannerDeadline} onChange={(event) => setForm({ ...form, bannerDeadline: event.target.value })} /></Field>
            <Button type="submit" disabled={busy}><Save className="h-4 w-4" /> Save settings</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Eligibility and limits</CardTitle></CardHeader><CardContent className="space-y-5">
            <Toggle label="Require verified email" checked={form.eligibilityRules.require_email_verification} onChange={(value) => setForm({ ...form, eligibilityRules: { ...form.eligibilityRules, require_email_verification: value } })} />
            <Field label="Maximum successful referrals per user"><Input type="number" min={1} value={form.eligibilityRules.max_successful_per_referrer} onChange={(event) => setForm({ ...form, eligibilityRules: { ...form.eligibilityRules, max_successful_per_referrer: Number(event.target.value) } })} /></Field>
            <Field label="Maximum successful referrals per user per day"><Input type="number" min={1} value={form.eligibilityRules.max_successful_per_referrer_per_day} onChange={(event) => setForm({ ...form, eligibilityRules: { ...form.eligibilityRules, max_successful_per_referrer_per_day: Number(event.target.value) } })} /></Field>
            <div className="rounded-md border border-border bg-secondary/40 p-4 text-sm text-muted-foreground"><p className="font-medium text-foreground">Built-in safeguards</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Rewards are atomic and cannot be issued twice.</li><li>Self-referrals and repeated account attribution are blocked.</li><li>Every credit award is written to an auditable ledger.</li><li>Only verified accounts can complete a referral.</li></ul></div>
            <div className="rounded-md bg-secondary/50 p-4"><p className="text-sm font-medium">Current status</p><p className="mt-1 text-2xl font-bold capitalize">{form.status}</p><p className="mt-1 text-xs text-muted-foreground">Times are evaluated by the backend. The configured timezone is {form.timezone}.</p></div>
          </CardContent></Card>
        </form>
      </section>
    </PageShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) { return <Card><CardContent className="flex items-center gap-3 p-5"><Icon className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-2 block font-medium">{label}</span>{children}</label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4"><span className="text-sm font-medium">{label}</span><Switch checked={checked} onCheckedChange={onChange} aria-label={label} /></div>; }
function toLocalInput(value: string) { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); }
