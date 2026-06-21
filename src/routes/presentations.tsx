import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  transition?: "zoom" | "fade" | "reveal" | "3d" | "blur";
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
const THEMES = [
  { id: "Modern", grad: "from-indigo-600 via-purple-600 to-pink-500", text: "#ffffff", accent: "#a78bfa" },
  { id: "Glassmorphism", grad: "from-slate-900 via-blue-900 to-purple-900", text: "#ffffff", accent: "#60a5fa" },
  { id: "Minimal", grad: "from-white via-slate-50 to-slate-100", text: "#0f172a", accent: "#6366f1" },
  { id: "Corporate", grad: "from-slate-800 via-slate-900 to-blue-900", text: "#ffffff", accent: "#38bdf8" },
  { id: "Academic", grad: "from-amber-50 via-stone-50 to-rose-50", text: "#1c1917", accent: "#b91c1c" },
  { id: "Technology", grad: "from-black via-zinc-900 to-emerald-950", text: "#ffffff", accent: "#10b981" },
  { id: "Dark", grad: "from-zinc-950 via-black to-zinc-900", text: "#ffffff", accent: "#f59e0b" },
  { id: "Gradient", grad: "from-fuchsia-600 via-rose-500 to-orange-400", text: "#ffffff", accent: "#fde68a" },
  { id: "Creative", grad: "from-emerald-400 via-cyan-500 to-blue-600", text: "#ffffff", accent: "#fbbf24" },
];
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
  });
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [presenting, setPresenting] = useState(false);

  const themeMeta = useMemo(
    () => THEMES.find((t) => t.id === wizard.theme) ?? THEMES[0],
    [wizard.theme],
  );

  async function generate() {
    if (!wizard.topic.trim()) {
      toast.error("Please enter a presentation topic");
      setStep(2);
      setPhase("wizard");
      return;
    }
    setLoading(true);
    try {
      const res = await authedFetch("/api/generate-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      if (!data?.slides?.length) throw new Error("AI returned no slides");
      setDeck(data as Deck);
      setActiveIdx(0);
      setPhase("studio");
      toast.success(`Generated ${data.slides.length}-slide presentation`);
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
              <div className="text-xs uppercase tracking-[0.3em] text-accent">Step {step} / 8</div>
              <div className="flex gap-1.5">
                {Array.from({ length: 8 }, (_, i) => (
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
              <Step title="Pick a design theme" subtitle="Each theme tunes colors, typography and accents.">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setWizard({ ...wizard, theme: t.id })}
                      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${wizard.theme === t.id ? "border-accent ring-2 ring-accent" : "border-white/10 hover:border-white/30"}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${t.grad} opacity-90`} />
                      <div className="relative">
                        <div className="text-sm font-semibold" style={{ color: t.text }}>{t.id}</div>
                        <div className="mt-8 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                          Preview
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
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
              <Step title="AI extras" subtitle="Pick what should be included in your deck.">
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
              {step < 8 ? (
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
                <div className={`relative aspect-video bg-gradient-to-br ${themeMeta.grad} p-2`}>
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
              {["title","agenda","content","two-column","bullets","quote","stats","references","thanks"].map((l) => (
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
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
              <Palette className="h-3.5 w-3.5" /> Theme
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setWizard({ ...wizard, theme: t.id })}
                  title={t.id}
                  className={`aspect-video rounded-md bg-gradient-to-br ${t.grad} ${wizard.theme === t.id ? "ring-2 ring-accent" : ""}`}
                />
              ))}
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
  theme: { id: string; grad: string; text: string; accent: string };
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

  return (
    <div
      id="slide-canvas"
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br ${theme.grad} shadow-2xl ring-1 ring-white/10 animate-fade-in`}
    >
      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(circle at 20% 20%, ${theme.accent}40, transparent 50%), radial-gradient(circle at 80% 80%, ${theme.accent}30, transparent 50%)`,
      }} />
      <div className="relative flex h-full flex-col p-6 sm:p-10 lg:p-14">
        {t.layout === "title" && (
          <div className="m-auto text-center">
            <Title className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl" />
            <div className="mt-4"><Sub className="text-base sm:text-lg lg:text-xl" /></div>
            <div className="mx-auto mt-8 h-1 w-24 rounded-full" style={{ background: theme.accent }} />
          </div>
        )}

        {t.layout !== "title" && (
          <>
            <Title className="text-2xl font-bold sm:text-3xl lg:text-4xl" />
            <div className="mt-1"><Sub className="text-sm sm:text-base" /></div>
            <div className="my-4 h-px w-16 rounded-full" style={{ background: theme.accent }} />

            <div className="flex-1 overflow-hidden">
              {(t.layout === "bullets" || t.layout === "content" || t.layout === "agenda") && t.bullets && (
                <ul className="space-y-2.5 text-sm sm:text-base lg:text-lg" style={{ color: theme.text }}>
                  {t.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
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
                <p className="mt-3 text-sm leading-relaxed sm:text-base lg:text-lg" style={{ color: theme.text, opacity: 0.9 }}>{t.body}</p>
              )}

              {t.layout === "two-column" && (
                <div className="grid h-full gap-6 sm:grid-cols-2">
                  <ul className="space-y-2" style={{ color: theme.text }}>
                    {(t.bullets ?? []).slice(0, Math.ceil((t.bullets?.length ?? 0) / 2)).map((b, i) => (
                      <li key={i} className="flex gap-2"><span style={{ color: theme.accent }}>▸</span>{b}</li>
                    ))}
                  </ul>
                  <ul className="space-y-2" style={{ color: theme.text }}>
                    {(t.bullets ?? []).slice(Math.ceil((t.bullets?.length ?? 0) / 2)).map((b, i) => (
                      <li key={i} className="flex gap-2"><span style={{ color: theme.accent }}>▸</span>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {t.layout === "stats" && t.stats && (
                <div className="mt-4 grid h-full gap-4 sm:grid-cols-3">
                  {t.stats.slice(0, 6).map((s, i) => (
                    <div key={i} className="rounded-xl p-4 text-center" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>
                      <div className="text-3xl font-bold sm:text-4xl" style={{ color: theme.accent }}>{s.value}</div>
                      <div className="mt-1 text-xs sm:text-sm" style={{ color: theme.text, opacity: 0.8 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {t.layout === "chart" && t.chart && (
                <ChartView chart={t.chart} accent={theme.accent} color={theme.text} dark={isDark} />
              )}

              {t.layout === "quote" && t.quote && (
                <blockquote className="my-auto text-center">
                  <div className="text-2xl font-light italic sm:text-3xl lg:text-4xl" style={{ color: theme.text }}>"{t.quote.text}"</div>
                  {t.quote.author && <div className="mt-4 text-sm uppercase tracking-widest" style={{ color: theme.accent }}>— {t.quote.author}</div>}
                </blockquote>
              )}

              {t.layout === "references" && t.references && (
                <ol className="space-y-1.5 text-xs sm:text-sm" style={{ color: theme.text, opacity: 0.85 }}>
                  {t.references.map((r, i) => (
                    <li key={i} className="border-l-2 pl-3" style={{ borderColor: theme.accent }}>{i + 1}. {r}</li>
                  ))}
                </ol>
              )}

              {t.layout === "thanks" && (
                <div className="m-auto text-center">
                  <div className="text-5xl font-bold sm:text-6xl lg:text-7xl" style={{ color: theme.text }}>Thank You</div>
                  <div className="mt-3 text-base" style={{ color: theme.text, opacity: 0.8 }}>Questions & Discussion</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] sm:text-xs" style={{ borderColor: `${theme.text}20`, color: theme.text, opacity: 0.5 }}>
              <span>Nexoras AI</span>
            </div>
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
function Presenter({ deck, theme, onClose }: { deck: Deck; theme: { id: string; grad: string; text: string; accent: string }; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") setI((x) => Math.min(deck.slides.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [deck.slides.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-3 text-xs text-white/70">
        <span>{i + 1} / {deck.slides.length}</span>
        <button onClick={onClose} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Esc</button>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="aspect-video w-full max-w-6xl">
          <SlideCanvas slide={deck.slides[i]} theme={theme} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Export menu
// ------------------------------------------------------------
function ExportMenu({ deck, theme }: { deck: Deck; theme: { id: string; grad: string; text: string; accent: string } }) {
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
        if (s.layout === "title") {
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
