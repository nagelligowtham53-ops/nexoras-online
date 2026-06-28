import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Wand2, Loader2, Plus, Trash2, ChevronLeft, ChevronRight,
  Download, FileText, Presentation as PresentationIcon,
  Palette, Type, Edit3, Play, Copy, Check, Pencil, Eraser, Timer, MousePointer2,
  Pause, RotateCcw, Maximize2,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authedFetch } from "@/lib/authed-fetch";
import jsPDF from "jspdf";
import {
  loadSettings, activeKey, checkRateLimit, recordUsage,
  buildCacheKey, getCached, setCached,
} from "@/lib/presentation-settings";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/presentations")({
  head: () => ({
    meta: [
      { title: "AI Presentation Studio — Create Stunning Decks in Seconds | Nexoras" },
      { name: "description", content: "Generate beautiful AI presentations for college, business and research. Edit live, export to PPTX, PDF, and Google Slides." },
      { property: "og:title", content: "Nexoras AI Presentation Studio" },
      { property: "og:description", content: "Create stunning AI presentations in seconds. Wizard-driven, fully editable, export-ready." },
    ],
  }),
  component: () => (
    <PremiumGate feature="AI Presentation Studio">
      <PresentationStudio />
    </PremiumGate>
  ),
});

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
type SlideLayout = "cover" | "title" | "agenda" | "content" | "two-column" | "bullets" | "quote" | "stats" | "chart" | "references" | "thanks";

interface CoverMeta {
  presenter?: string;
  college?: string;
  department?: string;
  subject?: string;
  professor?: string;
  rollNumber?: string;
  date?: string;
  seminar?: string;
}

interface Slide {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  stats?: { label: string; value: string }[];
  chart?: { type: "bar" | "pie" | "line"; labels: string[]; data: number[]; title?: string };
  quote?: { text: string; author?: string };
  references?: string[];
  notes?: string;
  cover?: CoverMeta;
  transition?: "zoom" | "fade" | "reveal" | "3d" | "blur" | "liquid" | "infinity" | "orbital" | "wave" | "crystal" | "galaxy" | "book" | "cinematic" | "smart";
}

interface Deck {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

interface WizardState {
  topic: string;
  type: string;
  audience: string;
  goal: string;
  slides: number;
  theme: string;
  depth: string;
  language: string;
  animation: string;
  includeNotes: boolean;
  includeCharts: boolean;
  includeReferences: boolean;
  customPrompt: string;
  // Cover metadata
  presenter: string;
  college: string;
  department: string;
  subject: string;
  professor: string;
  rollNumber: string;
  seminar: string;
}

const PRESENTATION_TYPES = [
  "College Seminar","College Assignment","Project Presentation","Final Year Project","Research Paper",
  "Thesis Defense","Business Pitch","Startup Pitch","Product Launch","Workshop","Interview Presentation",
  "Resume Portfolio","Classroom Lecture","Medical Presentation","Engineering Presentation","School Presentation",
  "Marketing Presentation","Investor Deck","Conference","Custom",
];
const AUDIENCES = ["School Students","College Students","Professors","Lecturers","Recruiters","Investors","Clients","Management","Researchers","General Public"];
const GOALS = ["Inform","Explain","Teach","Convince","Sell","Research","Seminar","Viva","Assignment","Interview"];
import {
  THEMES_CATALOG, THEME_CATEGORIES, smartSuggestThemes, surpriseMeTheme, themeBackground,
  type PresentationTheme, type ThemeCategory,
} from "@/lib/presentation-themes";
const THEMES = THEMES_CATALOG;
type ThemeMeta = PresentationTheme;
const DEPTHS = ["Quick Overview","Medium Detail","Very Detailed","Research Level","Professor Level"];
const LANGUAGES = ["English","Hindi","Telugu","Tamil","Bengali","Marathi","Spanish","French","German","Japanese","Chinese","Arabic"];
const ANIMS = ["No Animation","Basic","Smooth","Advanced","Premium Cinematic"];
const SLIDE_COUNTS = [5, 10, 15, 20, 30];

// ------------------------------------------------------------
// Studio
// ------------------------------------------------------------
function PresentationStudio() {
  const [phase, setPhase] = useState<"wizard" | "review" | "studio">("wizard");
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>({
    topic: "",
    type: "College Seminar",
    audience: "College Students",
    goal: "Inform",
    slides: 10,
    theme: "Glassmorphism",
    depth: "Medium Detail",
    language: "English",
    animation: "Smooth",
    includeNotes: true,
    includeCharts: true,
    includeReferences: true,
    customPrompt: "",
    presenter: "",
    college: "",
    department: "",
    subject: "",
    professor: "",
    rollNumber: "",
    seminar: "",
  });
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [customTheme, setCustomTheme] = useState<PresentationTheme | null>(null);
  const [themePrompt, setThemePrompt] = useState("");
  const [themeBusy, setThemeBusy] = useState(false);
  const [themeCat, setThemeCat] = useState<ThemeCategory | "All" | "Smart">("Smart");
  const [themeSearch, setThemeSearch] = useState("");

  const themeMeta = useMemo<PresentationTheme>(
    () => customTheme ?? THEMES.find((t) => t.id === wizard.theme) ?? THEMES[0],
    [wizard.theme, customTheme],
  );

  function applyTheme(t: PresentationTheme) {
    setCustomTheme(t.category === "Custom" ? t : null);
    setWizard((w) => ({ ...w, theme: t.id }));
  }
  function doSurprise() {
    applyTheme(surpriseMeTheme(Date.now()));
    toast.success("Surprise theme applied");
  }
  async function generateAITheme() {
    if (!themePrompt.trim()) { toast.error("Describe the theme you want"); return; }
    setThemeBusy(true);
    try {
      const res = await authedFetch("/api/generate-theme", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: themePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      applyTheme(data as PresentationTheme);
      toast.success(`Theme "${data.name}" applied`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI theme failed");
    } finally { setThemeBusy(false); }
  }

  async function generate() {
    if (!wizard.topic.trim()) {
      toast.error("Please enter a presentation topic");
      setStep(2);
      setPhase("wizard");
      return;
    }

    const settings = loadSettings();

    // Daily rate limit (built-in only)
    const rl = checkRateLimit(settings);
    if (!rl.ok) {
      toast.error(`Daily limit reached (${settings.dailyLimit}/day). Add your own API key in Settings to keep going.`);
      return;
    }

    const requestPayload = {
      topic: wizard.topic,
      type: wizard.type,
      audience: wizard.audience,
      goal: wizard.goal,
      slides: wizard.slides,
      theme: wizard.theme,
      depth: wizard.depth,
      language: wizard.language,
      includeNotes: wizard.includeNotes,
      includeCharts: wizard.includeCharts,
      includeReferences: wizard.includeReferences,
      customPrompt: wizard.customPrompt,
    };

    setLoading(true);
    try {
      // Cache hit?
      const cacheKey = await buildCacheKey(requestPayload);
      const cached = getCached(cacheKey) as { title?: string; subtitle?: string; slides?: Slide[] } | null;
      let data: { title?: string; subtitle?: string; slides?: Slide[] } | null = cached;

      if (data) {
        toast.success("Loaded from cache — no AI credits used");
      } else {
        const res = await authedFetch("/api/generate-presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...requestPayload,
            provider: settings.provider,
            userApiKey: activeKey(settings),
          }),
        });
        const json = await res.json();
        if (!res.ok || json?.friendly) {
          const msg = json?.error ?? "Generation failed";
          if (json?.code === "credits" || json?.code === "no_key" || json?.code === "rate_limit") {
            toast.error(msg, {
              action: { label: "Open Settings", onClick: () => { window.location.href = "/presentation-settings"; } },
              duration: 8000,
            });
          } else {
            toast.error(msg);
          }
          return;
        }
        if (!json?.slides?.length) {
          toast.error("AI returned no slides. Try a more specific topic.");
          return;
        }
        data = json;
        setCached(cacheKey, data);
        if (settings.provider === "groq") recordUsage();
      }

      // Build premium cover slide as slide 1
      const coverSlide: Slide = {
        layout: "cover",
        title: data!.title || wizard.topic,
        subtitle: data!.subtitle || wizard.type,
        cover: {
          presenter: wizard.presenter,
          college: wizard.college,
          department: wizard.department,
          subject: wizard.subject,
          professor: wizard.professor,
          rollNumber: wizard.rollNumber,
          seminar: wizard.seminar || wizard.type,
          date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
        },
        transition: "cinematic",
      };
      const transitions: Record<string, Slide["transition"]> = {
        title: "infinity", agenda: "wave", content: "smart", "two-column": "orbital",
        bullets: "liquid", quote: "cinematic", stats: "crystal", chart: "orbital",
        references: "book", thanks: "galaxy",
      };
      const annotated = (data!.slides as Slide[]).map((s, idx) => ({
        ...s,
        transition: s.transition ?? transitions[s.layout] ?? (idx % 2 === 0 ? "cinematic" : "liquid"),
      }));
      const withCover: Deck = { title: data!.title ?? wizard.topic, subtitle: data!.subtitle, slides: [coverSlide, ...annotated] };
      setDeck(withCover);
      setActiveIdx(0);
      setPhase("studio");
      toast.success(`Generated ${withCover.slides.length}-slide presentation`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // WIZARD
  // -----------------------------
  if (phase === "wizard") {
    return (
      <PageShell>
        <Hero onStart={() => setStep(1)} />
        <section className="mx-auto max-w-5xl px-4 pb-20 lg:px-8">
          <div className="glass rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-indigo-950/40 to-purple-950/40 p-6 backdrop-blur-xl lg:p-10">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-accent">Step {step} / 9</div>
              <div className="flex gap-1.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < step ? "bg-accent" : "bg-white/10"}`} />
                ))}
              </div>
            </div>

            {step === 1 && (
              <Step title="What type of presentation?" subtitle="Choose the format that best fits your need.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {PRESENTATION_TYPES.map((t) => (
                    <ChoiceCard key={t} label={t} active={wizard.type === t} onClick={() => setWizard({ ...wizard, type: t })} />
                  ))}
                </div>
              </Step>
            )}

            {step === 2 && (
              <Step title="What's your topic?" subtitle="Be specific — the more detail, the better the result.">
                <Input
                  autoFocus
                  value={wizard.topic}
                  onChange={(e) => setWizard({ ...wizard, topic: e.target.value })}
                  placeholder="e.g. Artificial Intelligence in Healthcare"
                  className="h-14 text-base"
                />
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Optional extra context</Label>
                  <Textarea
                    rows={3}
                    value={wizard.customPrompt}
                    onChange={(e) => setWizard({ ...wizard, customPrompt: e.target.value })}
                    placeholder="Focus areas, key points to emphasize, specific case studies, etc."
                  />
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step title="Who is your audience?" subtitle="We'll tune tone and complexity for them.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {AUDIENCES.map((a) => (
                    <ChoiceCard key={a} label={a} active={wizard.audience === a} onClick={() => setWizard({ ...wizard, audience: a })} />
                  ))}
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step title="What's your goal?" subtitle="What outcome do you want from this presentation?">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {GOALS.map((g) => (
                    <ChoiceCard key={g} label={g} active={wizard.goal === g} onClick={() => setWizard({ ...wizard, goal: g })} />
                  ))}
                </div>
              </Step>
            )}

            {step === 5 && (
              <Step title="How many slides?" subtitle="You can add or remove later.">
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {SLIDE_COUNTS.map((n) => (
                    <ChoiceCard key={n} label={`${n} slides`} active={wizard.slides === n} onClick={() => setWizard({ ...wizard, slides: n })} />
                  ))}
                </div>
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Or custom</Label>
                  <Input
                    type="number" min={3} max={40}
                    value={wizard.slides}
                    onChange={(e) => setWizard({ ...wizard, slides: Math.max(3, Math.min(40, Number(e.target.value) || 10)) })}
                  />
                </div>
              </Step>
            )}

            {step === 6 && (
              <Step title="Pick a design theme" subtitle="60+ premium themes, AI generator, smart suggestions, and Surprise Me.">
                <ThemeBrowser
                  current={themeMeta}
                  cat={themeCat} setCat={setThemeCat}
                  search={themeSearch} setSearch={setThemeSearch}
                  wizardCtx={{ type: wizard.type, audience: wizard.audience, topic: wizard.topic }}
                  onPick={applyTheme}
                  onSurprise={doSurprise}
                  themePrompt={themePrompt} setThemePrompt={setThemePrompt}
                  onAIGenerate={generateAITheme} aiBusy={themeBusy}
                  customTheme={customTheme} onCustomize={setCustomTheme}
                />
              </Step>
            )}

            {step === 7 && (
              <Step title="Depth, animation & language" subtitle="Final tuning before generation.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField label="Content depth" value={wizard.depth} options={DEPTHS} onChange={(v) => setWizard({ ...wizard, depth: v })} />
                  <SelectField label="Animation level" value={wizard.animation} options={ANIMS} onChange={(v) => setWizard({ ...wizard, animation: v })} />
                  <SelectField label="Language" value={wizard.language} options={LANGUAGES} onChange={(v) => setWizard({ ...wizard, language: v })} />
                </div>
              </Step>
            )}

            {step === 8 && (
              <Step title="Cover slide details" subtitle="Personalize your premium cover slide. All fields optional.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Your name" value={wizard.presenter} placeholder="e.g. Aarav Sharma" onChange={(v) => setWizard({ ...wizard, presenter: v })} />
                  <TextField label="Roll number" value={wizard.rollNumber} placeholder="e.g. 22BCE1234" onChange={(v) => setWizard({ ...wizard, rollNumber: v })} />
                  <TextField label="College / School" value={wizard.college} placeholder="e.g. IIT Bombay" onChange={(v) => setWizard({ ...wizard, college: v })} />
                  <TextField label="Department" value={wizard.department} placeholder="e.g. Computer Science" onChange={(v) => setWizard({ ...wizard, department: v })} />
                  <TextField label="Subject" value={wizard.subject} placeholder="e.g. Artificial Intelligence" onChange={(v) => setWizard({ ...wizard, subject: v })} />
                  <TextField label="Professor / Guide" value={wizard.professor} placeholder="e.g. Dr. Priya Verma" onChange={(v) => setWizard({ ...wizard, professor: v })} />
                  <TextField label="Seminar / Project name" value={wizard.seminar} placeholder="e.g. Final Year Seminar" onChange={(v) => setWizard({ ...wizard, seminar: v })} />
                </div>
              </Step>
            )}

            {step === 9 && (
              <Step title="AI extras & review" subtitle="Pick what should be included in your deck.">
                <div className="grid gap-2 sm:grid-cols-2">
                  <ToggleRow label="Speaker notes" value={wizard.includeNotes} onChange={(v) => setWizard({ ...wizard, includeNotes: v })} />
                  <ToggleRow label="Charts / data slides" value={wizard.includeCharts} onChange={(v) => setWizard({ ...wizard, includeCharts: v })} />
                  <ToggleRow label="References & bibliography" value={wizard.includeReferences} onChange={(v) => setWizard({ ...wizard, includeReferences: v })} />
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wider text-accent">Review</div>
                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <Row k="Topic" v={wizard.topic || "—"} />
                    <Row k="Type" v={wizard.type} />
                    <Row k="Audience" v={wizard.audience} />
                    <Row k="Goal" v={wizard.goal} />
                    <Row k="Slides" v={String(wizard.slides)} />
                    <Row k="Theme" v={wizard.theme} />
                    <Row k="Depth" v={wizard.depth} />
                    <Row k="Language" v={wizard.language} />
                  </div>
                </div>
              </Step>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" disabled={step === 1} onClick={() => setStep(Math.max(1, step - 1))}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 9 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 2 && !wizard.topic.trim()}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:opacity-90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating..." : "Generate Presentation"}
                </Button>
              )}
            </div>
          </div>

          <Features />
        </section>
      </PageShell>
    );
  }

  // -----------------------------
  // STUDIO
  // -----------------------------
  if (!deck) return null;
  const slide = deck.slides[activeIdx];

  return (
    <PageShell>
      <div className="border-b border-border bg-gradient-to-r from-slate-950 via-indigo-950/40 to-purple-950/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="min-w-0">
            <input
              value={deck.title}
              onChange={(e) => setDeck({ ...deck, title: e.target.value })}
              className="w-full max-w-md truncate bg-transparent text-base font-semibold outline-none"
            />
            <div className="text-xs text-muted-foreground">{deck.slides.length} slides · {wizard.theme} · {wizard.language}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPhase("wizard")}>
              <Wand2 className="h-3.5 w-3.5" /> New
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPresenting(true)}>
              <Play className="h-3.5 w-3.5" /> Present
            </Button>
            <ExportMenu deck={deck} theme={themeMeta} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[220px_1fr_300px] lg:px-8">
        {/* Slide thumbnails */}
        <aside className="order-2 lg:order-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Slides</span>
            <button
              className="rounded p-1 hover:bg-white/5"
              onClick={() => {
                const newSlide: Slide = { layout: "content", title: "New slide", bullets: ["Add your content"] };
                const slides = [...deck.slides, newSlide];
                setDeck({ ...deck, slides });
                setActiveIdx(slides.length - 1);
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {deck.slides.map((s, i) => (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`group cursor-pointer overflow-hidden rounded-lg border transition-all ${activeIdx === i ? "border-accent ring-1 ring-accent" : "border-white/10 hover:border-white/30"}`}
              >
                <div className={`relative aspect-video p-2 ${themeBackground(themeMeta).className}`} style={themeBackground(themeMeta).style}>
                  <div className="absolute left-1.5 top-1 text-[9px] text-white/70">{i + 1}</div>
                  <div className="line-clamp-3 pt-2 text-[10px] font-medium" style={{ color: themeMeta.text }}>
                    {s.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="order-1 lg:order-2">
          <SlideCanvas slide={slide} theme={themeMeta} editable onChange={(updated) => {
            const slides = [...deck.slides];
            slides[activeIdx] = updated;
            setDeck({ ...deck, slides });
          }} />

          <div className="mt-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={activeIdx === 0} onClick={() => setActiveIdx(activeIdx - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">Slide {activeIdx + 1} / {deck.slides.length}</span>
            <Button variant="ghost" size="sm" disabled={activeIdx === deck.slides.length - 1} onClick={() => setActiveIdx(activeIdx + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>

        {/* Side panel */}
        <aside className="order-3 space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
              <Edit3 className="h-3.5 w-3.5" /> Slide settings
            </div>
            <Label className="text-xs">Layout</Label>
            <select
              value={slide.layout}
              onChange={(e) => {
                const slides = [...deck.slides];
                slides[activeIdx] = { ...slide, layout: e.target.value as SlideLayout };
                setDeck({ ...deck, slides });
              }}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
            >
              {["cover","title","agenda","content","two-column","bullets","quote","stats","chart","references","thanks"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <Label className="mt-3 block text-xs">Speaker notes</Label>
            <Textarea
              rows={4}
              value={slide.notes ?? ""}
              onChange={(e) => {
                const slides = [...deck.slides];
                slides[activeIdx] = { ...slide, notes: e.target.value };
                setDeck({ ...deck, slides });
              }}
              placeholder="What to say while showing this slide..."
            />

            <Button
              variant="destructive" size="sm" className="mt-3 w-full"
              disabled={deck.slides.length <= 1}
              onClick={() => {
                const slides = deck.slides.filter((_, i) => i !== activeIdx);
                setDeck({ ...deck, slides });
                setActiveIdx(Math.max(0, activeIdx - 1));
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete slide
            </Button>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-accent">
              <span className="flex items-center gap-2"><Palette className="h-3.5 w-3.5" /> Theme</span>
              <button onClick={doSurprise} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20">Surprise</button>
            </div>
            <div className="mb-2 text-[10px] text-muted-foreground truncate">{themeMeta.name} · {themeMeta.category}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {THEMES.slice(0, 24).map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t)}
                  title={t.name}
                  className={`aspect-video rounded-md ${themeBackground(t).className} ${!customTheme && wizard.theme === t.id ? "ring-2 ring-accent" : ""}`}
                  style={themeBackground(t).style}
                />
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Input value={themePrompt} onChange={(e) => setThemePrompt(e.target.value)} placeholder="Describe a theme…" className="h-8 text-xs" />
              <Button size="sm" variant="outline" className="w-full" onClick={generateAITheme} disabled={themeBusy}>
                {themeBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate
              </Button>
              <ThemeCustomizer base={themeMeta} onApply={(t) => { setCustomTheme(t); setWizard((w) => ({ ...w, theme: t.id })); }} />
            </div>
          </div>
        </aside>
      </div>

      {presenting && (
        <Presenter deck={deck} theme={themeMeta} onClose={() => setPresenting(false)} />
      )}
    </PageShell>
  );
}

// ------------------------------------------------------------
// Hero
// ------------------------------------------------------------
function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center lg:px-8 lg:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
          <Sparkles className="h-3 w-3 text-accent" /> Nexoras AI Presentation Studio
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Create Stunning AI Presentations<br />
          <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            in Seconds
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
          Generate beautiful presentations with AI, customize every slide, and export in professional formats — PPTX, PDF, Google Slides.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onStart} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Create with AI
          </Button>
          <Button size="lg" variant="outline" onClick={onStart} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
            <FileText className="h-4 w-4" /> From Topic
          </Button>
          <Link to="/presentation-settings">
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Palette className="h-4 w-4" /> AI Settings & Keys
            </Button>
          </Link>
        </div>
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50">
          <span>✓ 1000+ Templates</span>
          <span>✓ 50+ Languages</span>
          <span>✓ Export to PPTX / PDF</span>
          <span>✓ Real-time editing</span>
          <span>✓ Speaker notes</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Wand2, t: "AI Wizard", d: "Answer a few questions, get a complete deck." },
    { icon: Edit3, t: "Live Editor", d: "Edit every slide in real time with one click." },
    { icon: PresentationIcon, t: "Presenter Mode", d: "Fullscreen, timer, speaker notes." },
    { icon: Download, t: "Pro Export", d: "PPTX, PDF & speaker notes export." },
    { icon: Palette, t: "1000+ Themes", d: "Modern, glassmorphism, academic, corporate." },
    { icon: Type, t: "50+ Languages", d: "Generate decks in your preferred language." },
  ];
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f) => (
        <div key={f.t} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <f.icon className="h-5 w-5 text-accent" />
          <div className="mt-3 font-semibold">{f.t}</div>
          <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Slide canvas
// ------------------------------------------------------------
function SlideCanvas({
  slide, theme, editable = false, onChange,
}: {
  slide: Slide;
  theme: ThemeMeta;
  editable?: boolean;
  onChange?: (s: Slide) => void;
}) {
  const isDark = theme.text === "#ffffff";
  const t = slide;

  const Title = (props: { className?: string }) => (
    editable ? (
      <input
        value={t.title}
        onChange={(e) => onChange?.({ ...t, title: e.target.value })}
        className={`w-full bg-transparent outline-none ${props.className ?? ""}`}
        style={{ color: theme.text }}
      />
    ) : (
      <h2 className={props.className} style={{ color: theme.text }}>{t.title}</h2>
    )
  );

  const Sub = (props: { className?: string }) => t.subtitle != null ? (
    editable ? (
      <input
        value={t.subtitle ?? ""}
        onChange={(e) => onChange?.({ ...t, subtitle: e.target.value })}
        className={`w-full bg-transparent outline-none ${props.className ?? ""}`}
        style={{ color: theme.text, opacity: 0.8 }}
      />
    ) : <p className={props.className} style={{ color: theme.text, opacity: 0.8 }}>{t.subtitle}</p>
  ) : null;

  const transitionClass: Record<NonNullable<Slide["transition"]>, string> = {
    zoom: "slide-anim-zoom",
    fade: "slide-anim-fade",
    reveal: "slide-anim-reveal",
    "3d": "slide-anim-3d",
    blur: "slide-anim-blur",
    liquid: "slide-anim-liquid",
    infinity: "slide-anim-infinity",
    orbital: "slide-anim-orbital",
    wave: "slide-anim-wave",
    crystal: "slide-anim-crystal",
    galaxy: "slide-anim-galaxy",
    book: "slide-anim-book",
    cinematic: "slide-anim-cinematic",
    smart: "slide-anim-smart",
  };
  const animClass = transitionClass[t.transition ?? "cinematic"] ?? "slide-anim-cinematic";
  // staggered child animation helper
  const stagger = (i: number): React.CSSProperties => ({ animationDelay: `${0.15 + i * 0.08}s` });

  const handleParallax = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    e.currentTarget.style.setProperty("--nx-mx", String(mx));
    e.currentTarget.style.setProperty("--nx-my", String(my));
  };

  return (
    <div
      id="slide-canvas"
      key={`${t.layout}-${t.title}`}
      onMouseMove={handleParallax}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 ${themeBackground(theme).className} ${animClass} animate-gradient-shift`}
      style={themeBackground(theme).style}
    >
      {/* glow orbs */}
      <div className="glow-orb animate-float-orb nx-parallax-deep" style={{ left: "8%", top: "12%", width: 280, height: 280, background: theme.accent }} />
      <div className="glow-orb animate-float-orb nx-parallax-deep" style={{ right: "6%", bottom: "10%", width: 320, height: 320, background: theme.accent, animationDelay: "3s" }} />

      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(circle at 20% 20%, ${theme.accent}40, transparent 50%), radial-gradient(circle at 80% 80%, ${theme.accent}30, transparent 50%)`,
      }} />

      {/* floating particles */}
      {t.layout === "cover" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute block rounded-full"
              style={{
                left: `${(i * 37) % 100}%`,
                bottom: `-10px`,
                width: 4 + (i % 4) * 2,
                height: 4 + (i % 4) * 2,
                background: `${theme.accent}aa`,
                animation: `particle-drift ${10 + (i % 6)}s linear ${i * 0.6}s infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative flex h-full flex-col p-6 sm:p-10 lg:p-14">
        {t.layout === "cover" && (
          <div className="m-auto w-full max-w-3xl">
            <div className="slide-element mb-4 flex items-center justify-center" style={stagger(0)}>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.25em]"
                style={{ borderColor: `${theme.accent}80`, color: theme.text, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                <Sparkles className="h-3 w-3" style={{ color: theme.accent }} /> AI Generated · Nexoras
              </span>
            </div>
            <div className="rounded-3xl p-6 text-center backdrop-blur-xl sm:p-10 slide-element" style={{
              ...stagger(1),
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: `0 30px 80px -20px ${theme.accent}40`,
            }}>
              <Title className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl" />
              {t.subtitle && <div className="mt-2"><Sub className="text-sm sm:text-base lg:text-lg" /></div>}
              <div className="mx-auto mt-4 h-1 w-24 rounded-full" style={{ background: theme.accent }} />
              {t.cover && (
                <div className="mt-6 grid gap-2 text-left text-xs sm:grid-cols-2 sm:text-sm" style={{ color: theme.text }}>
                  {t.cover.seminar && <CoverRow accent={theme.accent} k="Seminar" v={t.cover.seminar} />}
                  {t.cover.subject && <CoverRow accent={theme.accent} k="Subject" v={t.cover.subject} />}
                  {t.cover.presenter && <CoverRow accent={theme.accent} k="Presented by" v={t.cover.presenter} />}
                  {t.cover.rollNumber && <CoverRow accent={theme.accent} k="Roll No" v={t.cover.rollNumber} />}
                  {t.cover.department && <CoverRow accent={theme.accent} k="Department" v={t.cover.department} />}
                  {t.cover.college && <CoverRow accent={theme.accent} k="College" v={t.cover.college} />}
                  {t.cover.professor && <CoverRow accent={theme.accent} k="Guide" v={t.cover.professor} />}
                  {t.cover.date && <CoverRow accent={theme.accent} k="Date" v={t.cover.date} />}
                </div>
              )}
            </div>
          </div>
        )}

        {t.layout === "title" && (
          <div className="m-auto text-center">
            <div className="slide-element" style={stagger(0)}>
              <Title className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl" />
            </div>
            <div className="mt-4 slide-element" style={stagger(1)}><Sub className="text-base sm:text-lg lg:text-xl" /></div>
            <div className="mx-auto mt-8 h-1 w-24 rounded-full slide-element" style={{ background: theme.accent, ...stagger(2) }} />
          </div>
        )}

        {t.layout !== "title" && t.layout !== "cover" && (
          <>
            <div className="slide-element" style={stagger(0)}>
              <Title className="text-2xl font-bold sm:text-3xl lg:text-4xl" />
            </div>
            <div className="mt-1 slide-element" style={stagger(1)}><Sub className="text-sm sm:text-base" /></div>
            <div className="my-4 h-px w-16 rounded-full slide-element" style={{ background: theme.accent, ...stagger(2) }} />

            <div className="flex-1 overflow-hidden">
              {(t.layout === "bullets" || t.layout === "content" || t.layout === "agenda") && t.bullets && (
                <ul className="space-y-2.5 text-sm sm:text-base lg:text-lg" style={{ color: theme.text }}>
                  {t.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 slide-element" style={stagger(i + 3)}>
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: theme.accent }} />
                      {editable ? (
                        <input
                          value={b}
                          onChange={(e) => {
                            const bullets = [...(t.bullets ?? [])];
                            bullets[i] = e.target.value;
                            onChange?.({ ...t, bullets });
                          }}
                          className="w-full bg-transparent outline-none"
                          style={{ color: theme.text }}
                        />
                      ) : <span>{b}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {t.layout === "content" && t.body && (
                <p className="mt-3 text-sm leading-relaxed sm:text-base lg:text-lg slide-element" style={{ color: theme.text, opacity: 0.9, ...stagger(3) }}>{t.body}</p>
              )}

              {t.layout === "two-column" && (
                <div className="grid h-full gap-6 sm:grid-cols-2">
                  <ul className="space-y-2" style={{ color: theme.text }}>
                    {(t.bullets ?? []).slice(0, Math.ceil((t.bullets?.length ?? 0) / 2)).map((b, i) => (
                      <li key={i} className="flex gap-2 slide-element" style={stagger(i + 3)}><span style={{ color: theme.accent }}>▸</span>{b}</li>
                    ))}
                  </ul>
                  <ul className="space-y-2" style={{ color: theme.text }}>
                    {(t.bullets ?? []).slice(Math.ceil((t.bullets?.length ?? 0) / 2)).map((b, i) => (
                      <li key={i} className="flex gap-2 slide-element" style={stagger(i + 4)}><span style={{ color: theme.accent }}>▸</span>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {t.layout === "stats" && t.stats && (
                <div className="mt-4 grid h-full gap-4 sm:grid-cols-3">
                  {t.stats.slice(0, 6).map((s, i) => (
                    <div key={i} className="rounded-xl p-4 text-center slide-element" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", ...stagger(i + 3) }}>
                      <div className="text-3xl font-bold sm:text-4xl" style={{ color: theme.accent }}>{s.value}</div>
                      <div className="mt-1 text-xs sm:text-sm" style={{ color: theme.text, opacity: 0.8 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {t.layout === "chart" && t.chart && (
                <div className="slide-element" style={stagger(3)}>
                  <ChartView chart={t.chart} accent={theme.accent} color={theme.text} dark={isDark} />
                </div>
              )}

              {t.layout === "quote" && t.quote && (
                <blockquote className="my-auto text-center slide-element" style={stagger(3)}>
                  <div className="text-2xl font-light italic sm:text-3xl lg:text-4xl" style={{ color: theme.text }}>"{t.quote.text}"</div>
                  {t.quote.author && <div className="mt-4 text-sm uppercase tracking-widest" style={{ color: theme.accent }}>— {t.quote.author}</div>}
                </blockquote>
              )}

              {t.layout === "references" && t.references && (
                <ol className="space-y-1.5 text-xs sm:text-sm" style={{ color: theme.text, opacity: 0.85 }}>
                  {t.references.map((r, i) => (
                    <li key={i} className="border-l-2 pl-3 slide-element" style={{ borderColor: theme.accent, ...stagger(i + 3) }}>{i + 1}. {r}</li>
                  ))}
                </ol>
              )}

              {t.layout === "thanks" && (
                <div className="m-auto text-center">
                  <div className="text-5xl font-bold sm:text-6xl lg:text-7xl slide-element" style={{ color: theme.text, ...stagger(0) }}>Thank You</div>
                  <div className="mt-3 text-base slide-element" style={{ color: theme.text, opacity: 0.8, ...stagger(1) }}>Questions & Discussion</div>
                </div>
              )}
            </div>

            {t.layout === "thanks" && (
              <div className="mt-4 flex items-center justify-end border-t pt-3 text-[9px] tracking-wider" style={{ borderColor: `${theme.text}15`, color: theme.text, opacity: 0.35 }}>
                <span>designed with nexoras</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChartView({ chart, accent, color, dark }: { chart: NonNullable<Slide["chart"]>; accent: string; color: string; dark: boolean }) {
  const max = Math.max(...chart.data, 1);
  if (chart.type === "pie") {
    const total = chart.data.reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    return (
      <div className="mt-2 flex h-full items-center gap-6">
        <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
          {chart.data.map((v, i) => {
            const pct = (v / total) * 100;
            const dash = `${pct} ${100 - pct}`;
            const hue = (i * 60) % 360;
            const el = <circle key={i} r="15.915" cx="50" cy="50" fill="transparent" stroke={`hsl(${hue}, 70%, 60%)`} strokeWidth="20" strokeDasharray={dash} strokeDashoffset={-offset} />;
            offset += pct;
            return el;
          })}
        </svg>
        <ul className="space-y-1.5 text-sm" style={{ color }}>
          {chart.labels.map((l, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded" style={{ background: `hsl(${(i * 60) % 360}, 70%, 60%)` }} />
              {l} · {chart.data[i]}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="mt-2 flex h-full flex-col">
      <div className="flex flex-1 items-end gap-3 px-2">
        {chart.data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${(v / max) * 80}%`, background: `linear-gradient(to top, ${accent}, ${accent}80)` }}
            />
            <div className="text-[10px]" style={{ color, opacity: 0.7 }}>{chart.labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Presenter (fullscreen)
// ------------------------------------------------------------
function Presenter({ deck, theme, onClose }: { deck: Deck; theme: ThemeMeta; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [laser, setLaser] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingActive = useRef(false);

  // timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => setI((x) => (x + 1) % deck.slides.length), 6000);
    return () => clearInterval(id);
  }, [autoPlay, deck.slides.length]);

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") setI((x) => Math.min(deck.slides.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      if (e.key.toLowerCase() === "l") setLaser((v) => !v);
      if (e.key.toLowerCase() === "d") setDrawing((v) => !v);
      if (e.key.toLowerCase() === "n") setShowNotes((v) => !v);
      if (e.key.toLowerCase() === "p") setAutoPlay((v) => !v);
      if (e.key.toLowerCase() === "c") {
        const c = canvasRef.current;
        if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      }
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [deck.slides.length, onClose]);

  // clear drawing on slide change
  useEffect(() => {
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, [i]);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (laser) setPointer({ x: e.clientX, y: e.clientY });
    if (drawing && drawingActive.current) {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  }

  // resize canvas to viewport
  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onPointerMove={handlePointerMove}
      onPointerDown={(e) => {
        if (!drawing) return;
        drawingActive.current = true;
        const c = canvasRef.current; if (!c) return;
        const rect = c.getBoundingClientRect();
        const ctx = c.getContext("2d"); if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerUp={() => { drawingActive.current = false; }}
      style={{ cursor: laser ? "none" : drawing ? "crosshair" : "default" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 p-3 text-xs text-white/80">
        <div className="flex items-center gap-3">
          <span className="rounded bg-white/10 px-2 py-1 font-mono">{i + 1} / {deck.slides.length}</span>
          <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 font-mono">
            <Timer className="h-3 w-3" /> {mm}:{ss}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PresenterBtn active={laser} onClick={() => setLaser(!laser)} icon={MousePointer2} label="Laser (L)" />
          <PresenterBtn active={drawing} onClick={() => setDrawing(!drawing)} icon={Pencil} label="Draw (D)" />
          <PresenterBtn onClick={() => { const c = canvasRef.current; if (c) c.getContext("2d")?.clearRect(0,0,c.width,c.height); }} icon={Eraser} label="Clear (C)" />
          <PresenterBtn active={showNotes} onClick={() => setShowNotes(!showNotes)} icon={FileText} label="Notes (N)" />
          <PresenterBtn active={autoPlay} onClick={() => setAutoPlay(!autoPlay)} icon={autoPlay ? Pause : Play} label="Auto (P)" />
          <PresenterBtn onClick={() => setElapsed(0)} icon={RotateCcw} label="Reset timer" />
          <PresenterBtn onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} icon={Maximize2} label="Fullscreen" />
          <button onClick={onClose} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Esc</button>
        </div>
      </div>

      {/* Slide */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="aspect-video w-full max-w-6xl">
          <SlideCanvas slide={deck.slides[i]} theme={theme} />
        </div>
      </div>

      {/* Speaker notes drawer */}
      {showNotes && deck.slides[i].notes && (
        <div className="absolute bottom-16 left-4 right-4 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-black/80 p-3 text-sm text-white/90 backdrop-blur">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/50">Speaker notes</div>
          {deck.slides[i].notes}
        </div>
      )}

      {/* Bottom nav touch */}
      <div className="flex items-center justify-between p-3 text-xs text-white/60">
        <button onClick={() => setI(Math.max(0, i - 1))} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">← Prev</button>
        <span className="opacity-60">L laser · D draw · C clear · N notes · P auto · ←/→ navigate</span>
        <button onClick={() => setI(Math.min(deck.slides.length - 1, i + 1))} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Next →</button>
      </div>

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-40"
        style={{ display: drawing ? "block" : "none" }}
      />

      {/* Laser pointer */}
      {laser && pointer && (
        <div
          className="pointer-events-none fixed z-50 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pointer.x,
            top: pointer.y,
            background: theme.accent,
            boxShadow: `0 0 24px 8px ${theme.accent}, 0 0 60px 10px ${theme.accent}80`,
          }}
        />
      )}
    </div>
  );
}

function PresenterBtn({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${active ? "bg-accent text-accent-foreground" : "bg-white/10 text-white hover:bg-white/20"}`}
    >
      <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label.split(" ")[0]}</span>
    </button>
  );
}

// ------------------------------------------------------------
// Export menu
// ------------------------------------------------------------
function ExportMenu({ deck, theme }: { deck: Deck; theme: ThemeMeta }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function exportPPTX() {
    setBusy("pptx");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      const bgColors: Record<string, string> = {
        Modern: "4338CA", Glassmorphism: "1E1B4B", Minimal: "F8FAFC", Corporate: "0F172A",
        Academic: "FEF3C7", Technology: "0A0A0A", Dark: "09090B", Gradient: "BE185D", Creative: "059669",
      };
      const textColor = theme.text === "#ffffff" ? "FFFFFF" : "0F172A";
      const accentHex = theme.accent.replace("#", "").toUpperCase();
      const bg = bgColors[theme.id] ?? "1E1B4B";

      deck.slides.forEach((s) => {
        const slide = pptx.addSlide();
        slide.background = { color: bg };
        if (s.layout === "cover") {
          // Premium cover slide
          slide.addShape("rect", { x: 1.0, y: 1.2, w: 11.3, h: 5.3, fill: { color: textColor === "FFFFFF" ? "FFFFFF" : "000000", transparency: 92 }, line: { color: accentHex, width: 1 } });
          slide.addText("AI GENERATED · NEXORAS", { x: 1.0, y: 1.4, w: 11.3, h: 0.4, fontSize: 11, color: accentHex, align: "center", bold: true });
          slide.addText(s.title, { x: 1.0, y: 2.0, w: 11.3, h: 1.2, fontSize: 44, bold: true, color: textColor, align: "center", fontFace: "Calibri" });
          if (s.subtitle) slide.addText(s.subtitle, { x: 1.0, y: 3.2, w: 11.3, h: 0.5, fontSize: 18, color: textColor, align: "center" });
          slide.addShape("rect", { x: 6.2, y: 3.85, w: 0.9, h: 0.05, fill: { color: accentHex }, line: { color: accentHex } });
          if (s.cover) {
            const c = s.cover;
            const rows: Array<[string, string | undefined]> = [
              ["Seminar", c.seminar], ["Subject", c.subject],
              ["Presented by", c.presenter], ["Roll No", c.rollNumber],
              ["Department", c.department], ["College", c.college],
              ["Guide", c.professor], ["Date", c.date],
            ];
            const visible = rows.filter(([, v]) => v && v.trim());
            visible.forEach(([k, v], idx) => {
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              slide.addText(`${k}:  ${v}`, {
                x: 1.6 + col * 5.4, y: 4.1 + row * 0.4, w: 5.2, h: 0.35,
                fontSize: 12, color: textColor, align: "left",
              });
            });
          }
        } else if (s.layout === "title") {
          slide.addText(s.title, { x: 0.5, y: 2.5, w: 12.3, h: 1.5, fontSize: 54, bold: true, color: textColor, align: "center", fontFace: "Calibri" });
          if (s.subtitle) slide.addText(s.subtitle, { x: 0.5, y: 4.1, w: 12.3, h: 0.8, fontSize: 24, color: textColor, align: "center" });
        } else if (s.layout === "thanks") {
          slide.addText("Thank You", { x: 0.5, y: 2.8, w: 12.3, h: 1.5, fontSize: 72, bold: true, color: textColor, align: "center" });
          slide.addText("Questions & Discussion", { x: 0.5, y: 4.4, w: 12.3, h: 0.6, fontSize: 22, color: textColor, align: "center" });
        } else {
          slide.addText(s.title, { x: 0.5, y: 0.4, w: 12.3, h: 0.8, fontSize: 32, bold: true, color: textColor });
          slide.addShape("rect", { x: 0.5, y: 1.25, w: 0.8, h: 0.05, fill: { color: accentHex }, line: { color: accentHex } });
          if (s.subtitle) slide.addText(s.subtitle, { x: 0.5, y: 1.4, w: 12.3, h: 0.4, fontSize: 16, color: textColor });

          if (s.bullets?.length) {
            slide.addText(s.bullets.map((b) => ({ text: b, options: { bullet: true } })), {
              x: 0.7, y: 1.9, w: 12, h: 4.5, fontSize: 18, color: textColor, paraSpaceAfter: 8,
            });
          }
          if (s.body) {
            slide.addText(s.body, { x: 0.7, y: (s.bullets?.length ?? 0) > 0 ? 5.2 : 1.9, w: 12, h: 1.5, fontSize: 14, color: textColor });
          }
          if (s.stats?.length) {
            const w = 12 / s.stats.length;
            s.stats.forEach((st, i) => {
              slide.addText(st.value, { x: 0.7 + i * w, y: 2.5, w, h: 1, fontSize: 40, bold: true, color: accentHex, align: "center" });
              slide.addText(st.label, { x: 0.7 + i * w, y: 3.6, w, h: 0.6, fontSize: 14, color: textColor, align: "center" });
            });
          }
          if (s.quote) {
            slide.addText(`"${s.quote.text}"`, { x: 1, y: 2.3, w: 11.3, h: 2, fontSize: 28, italic: true, color: textColor, align: "center" });
            if (s.quote.author) slide.addText(`— ${s.quote.author}`, { x: 1, y: 4.4, w: 11.3, h: 0.5, fontSize: 16, color: accentHex, align: "center" });
          }
          if (s.references?.length) {
            slide.addText(s.references.map((r, i) => ({ text: `${i + 1}. ${r}`, options: {} })), {
              x: 0.7, y: 1.9, w: 12, h: 5, fontSize: 12, color: textColor, paraSpaceAfter: 6,
            });
          }
        }
        if (s.notes) slide.addNotes(s.notes);
      });

      await pptx.writeFile({ fileName: `${deck.title.replace(/[^\w\s-]/g, "")}.pptx` });
      toast.success("PPTX exported");
    } catch (e) {
      toast.error("PPTX export failed");
      console.error(e);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function exportPDF() {
    setBusy("pdf");
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });
      const node = document.getElementById("slide-canvas");
      if (!node) throw new Error("Slide not found");
      // Capture current slide (simplification: one slide)
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1280, 720);
      pdf.save(`${deck.title.replace(/[^\w\s-]/g, "")}-slide.pdf`);
      toast.success("PDF exported (current slide). Use PPTX for full deck.");
    } catch (e) {
      toast.error("PDF export failed");
      console.error(e);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function exportNotes() {
    setBusy("notes");
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text(deck.title, 14, 18);
      let y = 32;
      deck.slides.forEach((s, i) => {
        if (y > 270) { pdf.addPage(); y = 18; }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${i + 1}. ${s.title}`, 14, y); y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const notes = s.notes || "(no notes)";
        const lines = pdf.splitTextToSize(notes, 180);
        pdf.text(lines, 14, y); y += lines.length * 5 + 4;
      });
      pdf.save(`${deck.title.replace(/[^\w\s-]/g, "")}-notes.pdf`);
      toast.success("Speaker notes exported");
    } finally { setBusy(null); setOpen(false); }
  }

  function copyShareLink() {
    try {
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(deck))));
      const url = `${window.location.origin}/presentations?d=${payload}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch { toast.error("Copy failed"); }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen(!open)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-popover shadow-xl">
          <ExportItem icon={PresentationIcon} label="PowerPoint (.pptx)" loading={busy === "pptx"} onClick={exportPPTX} />
          <ExportItem icon={FileText} label="PDF (current slide)" loading={busy === "pdf"} onClick={exportPDF} />
          <ExportItem icon={FileText} label="Speaker notes PDF" loading={busy === "notes"} onClick={exportNotes} />
          <ExportItem icon={Copy} label="Copy share link" onClick={copyShareLink} />
        </div>
      )}
    </div>
  );
}

function ExportItem({ icon: Icon, label, loading, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; loading?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

// ------------------------------------------------------------
// Small building blocks
// ------------------------------------------------------------
function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChoiceCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${active ? "border-accent bg-accent/10 text-foreground" : "border-white/10 bg-white/5 hover:border-white/30"}`}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {active && <Check className="h-4 w-4 text-accent" />}
      </div>
    </button>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${value ? "border-accent bg-accent/10" : "border-white/10 bg-white/5"}`}>
      <span>{label}</span>
      <div className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${value ? "bg-accent" : "bg-white/10"}`}>
        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : ""}`} />
      </div>
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-2"><span className="w-20 text-xs uppercase tracking-wider text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}

function CoverRow({ k, v, accent }: { k: string; v: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
      <span className="text-[10px] uppercase tracking-wider opacity-60">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

// ------------------------------------------------------------
// Theme Browser (wizard step 6): categories + search + AI + Surprise
// ------------------------------------------------------------
function ThemeBrowser({
  current, cat, setCat, search, setSearch, wizardCtx, onPick, onSurprise,
  themePrompt, setThemePrompt, onAIGenerate, aiBusy, customTheme, onCustomize,
}: {
  current: PresentationTheme;
  cat: ThemeCategory | "All" | "Smart";
  setCat: (c: ThemeCategory | "All" | "Smart") => void;
  search: string; setSearch: (s: string) => void;
  wizardCtx: { type: string; audience: string; topic: string };
  onPick: (t: PresentationTheme) => void;
  onSurprise: () => void;
  themePrompt: string; setThemePrompt: (s: string) => void;
  onAIGenerate: () => void; aiBusy: boolean;
  customTheme: PresentationTheme | null;
  onCustomize: (t: PresentationTheme | null) => void;
}) {
  const list = useMemo(() => {
    let arr: PresentationTheme[] = THEMES_CATALOG;
    if (cat === "Smart") arr = smartSuggestThemes(wizardCtx);
    else if (cat !== "All") arr = arr.filter((t) => t.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return arr;
  }, [cat, search, wizardCtx]);

  return (
    <div className="space-y-4">
      {/* AI generator + surprise */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" /> AI Theme Generator
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={themePrompt}
            onChange={(e) => setThemePrompt(e.target.value)}
            placeholder="e.g. futuristic blue glassmorphism with floating particles"
            className="flex-1"
          />
          <Button onClick={onAIGenerate} disabled={aiBusy} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate
          </Button>
          <Button variant="outline" onClick={onSurprise}><Sparkles className="h-4 w-4" /> Surprise Me</Button>
        </div>
        {customTheme && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Using custom theme: <span className="text-foreground">{customTheme.name}</span></span>
            <button className="underline" onClick={() => onCustomize(null)}>Clear</button>
          </div>
        )}
      </div>

      {/* Category tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        {(["Smart","All", ...THEME_CATEGORIES] as Array<ThemeCategory | "All" | "Smart">).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-all ${cat === c ? "border-accent bg-accent/20 text-accent" : "border-white/10 text-muted-foreground hover:border-white/30"}`}
          >{c}</button>
        ))}
        <Input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search themes…" className="ml-auto h-8 w-40 text-xs"
        />
      </div>

      {/* Grid */}
      <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const b = themeBackground(t);
          const active = current.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${active ? "border-accent ring-2 ring-accent" : "border-white/10 hover:border-white/30"}`}
            >
              <div className={`absolute inset-0 ${b.className} opacity-90`} style={b.style} />
              <div className="relative">
                <div className="text-sm font-semibold drop-shadow" style={{ color: t.text }}>{t.name}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70" style={{ color: t.text }}>{t.category}</div>
                <div className="mt-6 flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-white/30" style={{ background: t.accent }} />
                  <span className="text-[10px] uppercase tracking-wider opacity-80" style={{ color: t.text }}>Accent</span>
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No themes match. Try another category or use AI Generate.</div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Theme Customizer (inline color editor)
// ------------------------------------------------------------
function ThemeCustomizer({ base, onApply }: { base: PresentationTheme; onApply: (t: PresentationTheme) => void }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState("#0f172a");
  const [b, setB] = useState("#1e1b4b");
  const [c, setC] = useState("#7c3aed");
  const [text, setText] = useState(base.text);
  const [accent, setAccent] = useState(base.accent);
  if (!open) {
    return <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}><Palette className="h-3 w-3" /> Customize</Button>;
  }
  const apply = () => {
    onApply({
      id: `Custom-${Date.now().toString(36)}`,
      name: "Custom Theme", category: "Custom",
      bg: `linear-gradient(135deg, ${a} 0%, ${b} 50%, ${c} 100%)`,
      text, accent,
    });
    setOpen(false);
  };
  const Row = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-10 cursor-pointer rounded border border-white/10 bg-transparent" />
    </label>
  );
  return (
    <div className="space-y-1.5 rounded-md border border-white/10 bg-black/30 p-2">
      <Row label="BG 1" value={a} onChange={setA} />
      <Row label="BG 2" value={b} onChange={setB} />
      <Row label="BG 3" value={c} onChange={setC} />
      <Row label="Text" value={text} onChange={setText} />
      <Row label="Accent" value={accent} onChange={setAccent} />
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}
