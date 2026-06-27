import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, KeyRound, Trash2, ArrowLeft, Activity, Shield, Eye, EyeOff } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  loadSettings, saveSettings, getUsage, cacheSize, clearCache,
  type PresentationAISettings, type AIProvider,
} from "@/lib/presentation-settings";

export const Route = createFileRoute("/presentation-settings")({
  head: () => ({ meta: [{ title: "Presentation AI Settings | Nexoras" }] }),
  component: () => (
    <PremiumGate feature="Presentation Settings">
      <SettingsPage />
    </PremiumGate>
  ),
});

const PROVIDERS: { id: AIProvider; name: string; sub: string; help: string }[] = [
  { id: "lovable", name: "Built-in (Nexoras AI)", sub: "Uses shared credits — daily limit applies", help: "No key needed. Subject to a daily rate limit." },
  { id: "gemini", name: "Google Gemini", sub: "gemini-2.5-flash · fast & generous free tier", help: "Get a key at aistudio.google.com/app/apikey" },
  { id: "openai", name: "OpenAI", sub: "gpt-4o-mini · reliable JSON output", help: "Get a key at platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic Claude", sub: "claude-3-5-haiku · great for structure", help: "Get a key at console.anthropic.com/settings/keys" },
];

function SettingsPage() {
  const [s, setS] = useState<PresentationAISettings | null>(null);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [usage, setUsage] = useState({ count: 0, total: 0 });
  const [cached, setCached] = useState(0);

  useEffect(() => {
    setS(loadSettings());
    const u = getUsage(); setUsage({ count: u.count, total: u.total });
    setCached(cacheSize());
  }, []);

  if (!s) return null;

  function update(patch: Partial<PresentationAISettings>) {
    setS(prev => prev ? { ...prev, ...patch } : prev);
  }
  function persist() {
    if (!s) return;
    saveSettings(s);
    toast.success("Settings saved");
  }
  function pickProvider(p: AIProvider) {
    update({ provider: p });
  }

  const remaining = s.provider === "lovable" ? Math.max(0, s.dailyLimit - usage.count) : Infinity;

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <Link to="/presentations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </Link>

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Presentation AI
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">AI Settings & Usage</h1>
          <p className="mt-2 text-muted-foreground">
            Bring your own API key for unlimited generation, switch providers, and monitor usage.
          </p>
        </header>

        {/* Usage panel */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <StatCard icon={<Activity className="h-4 w-4" />} label="Used today" value={`${usage.count}`} />
          <StatCard
            icon={<Shield className="h-4 w-4" />}
            label="Remaining (built-in)"
            value={remaining === Infinity ? "Unlimited" : `${remaining} / ${s.dailyLimit}`}
          />
          <StatCard icon={<Sparkles className="h-4 w-4" />} label="Cached decks" value={`${cached}`} />
        </div>

        {/* Provider picker */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-lg font-semibold mb-4">AI Provider</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => pickProvider(p.id)}
                className={`text-left rounded-xl border p-4 transition ${
                  s.provider === p.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.sub}</div>
                <div className="text-xs mt-2 text-muted-foreground">{p.help}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Keys */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> API Keys
          </h2>
          <p className="text-xs text-muted-foreground">
            Keys are stored only in your browser (localStorage) and sent directly to the chosen provider via the Nexoras server.
            They are never logged or persisted on our servers.
          </p>

          <KeyField label="Google Gemini API Key" placeholder="AIza..." value={s.geminiKey}
            onChange={v => update({ geminiKey: v })} reveal={show.gemini} toggle={() => setShow(x => ({ ...x, gemini: !x.gemini }))} />
          <KeyField label="OpenAI API Key" placeholder="sk-..." value={s.openaiKey}
            onChange={v => update({ openaiKey: v })} reveal={show.openai} toggle={() => setShow(x => ({ ...x, openai: !x.openai }))} />
          <KeyField label="Anthropic API Key" placeholder="sk-ant-..." value={s.anthropicKey}
            onChange={v => update({ anthropicKey: v })} reveal={show.anthropic} toggle={() => setShow(x => ({ ...x, anthropic: !x.anthropic }))} />
        </div>

        {/* Limit */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-lg font-semibold mb-3">Daily Limit (Built-in only)</h2>
          <div className="flex items-center gap-3">
            <Input
              type="number" min={1} max={200} value={s.dailyLimit}
              onChange={e => update({ dailyLimit: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">generations per day</span>
          </div>
        </div>

        {/* Cache */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Presentation Cache</h2>
            <p className="text-sm text-muted-foreground">Identical prompts reuse your last result instantly — zero AI cost.</p>
          </div>
          <Button variant="outline" onClick={() => { clearCache(); setCached(0); toast.success("Cache cleared"); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear ({cached})
          </Button>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link to="/presentations"><Button variant="outline">Cancel</Button></Link>
          <Button onClick={persist}>Save Settings</Button>
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function KeyField({
  label, placeholder, value, onChange, reveal, toggle,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void; reveal?: boolean; toggle: () => void }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1 flex gap-2">
        <Input
          type={reveal ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label="Toggle visibility">
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
