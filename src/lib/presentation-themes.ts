// Nexoras AI Presentation - Theme Engine
// Large premium catalog organized into categories, plus AI helpers.

export interface PresentationTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  // Either `grad` (tailwind classes for from-via-to) OR `bg` (raw CSS background) is used.
  grad?: string;
  bg?: string;
  text: string;
  accent: string;
  vibe?: string;
}

export type ThemeCategory =
  | "Education"
  | "Technology"
  | "Business"
  | "Creative"
  | "Animated"
  | "Minimal"
  | "Dark"
  | "Light"
  | "Custom";

export const THEME_CATEGORIES: ThemeCategory[] = [
  "Education", "Technology", "Business", "Creative", "Animated", "Minimal", "Dark", "Light",
];

// ---------- The catalog ----------
// Each entry can use `bg` (CSS) for richer gradients beyond Tailwind classes.
export const THEMES_CATALOG: PresentationTheme[] = [
  // ============ EDUCATION ============
  { id: "AcademicPro",       name: "Academic Pro",       category: "Education", bg: "linear-gradient(135deg,#fffaf2 0%,#fef3e2 55%,#fde6c8 100%)", text: "#1c1917", accent: "#b91c1c", vibe: "Classic academic warmth" },
  { id: "SeminarElite",      name: "Seminar Elite",      category: "Education", bg: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#312e81 100%)", text: "#ffffff", accent: "#fbbf24", vibe: "Authoritative deep navy" },
  { id: "ResearchModern",    name: "Research Modern",    category: "Education", bg: "linear-gradient(135deg,#ffffff 0%,#f8fafc 60%,#e0e7ff 100%)", text: "#0f172a", accent: "#4338ca" },
  { id: "UniversityGlass",   name: "University Glass",   category: "Education", bg: "linear-gradient(135deg,#0c4a6e 0%,#1e3a8a 60%,#312e81 100%)", text: "#ffffff", accent: "#7dd3fc" },
  { id: "ProfessorNotes",    name: "Professor Notes",    category: "Education", bg: "linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)", text: "#1f2937", accent: "#b45309" },
  { id: "EngineerBlueprint", name: "Engineering Blueprint", category: "Education", bg: "linear-gradient(135deg,#0b1d3a 0%,#0f3460 60%,#1e3a8a 100%)", text: "#e0f2fe", accent: "#22d3ee" },
  { id: "MedicalWhite",      name: "Medical White",      category: "Education", bg: "linear-gradient(135deg,#ffffff 0%,#f0fdfa 60%,#ccfbf1 100%)", text: "#0f172a", accent: "#0d9488" },
  { id: "ScienceLab",        name: "Science Lab",        category: "Education", bg: "linear-gradient(135deg,#052e16 0%,#064e3b 50%,#0f766e 100%)", text: "#ffffff", accent: "#a3e635" },
  { id: "MathPremium",       name: "Mathematics Premium",category: "Education", bg: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)", text: "#ffffff", accent: "#f0abfc" },
  { id: "FutureClassroom",   name: "Future Classroom",   category: "Education", bg: "linear-gradient(135deg,#0c0a09 0%,#1c1917 50%,#451a03 100%)", text: "#fef3c7", accent: "#fb923c" },

  // ============ TECHNOLOGY ============
  { id: "CyberNeon",         name: "Cyber Neon",         category: "Technology", bg: "linear-gradient(135deg,#020617 0%,#0c0a3e 50%,#3b0764 100%)", text: "#ffffff", accent: "#22d3ee" },
  { id: "AIMatrix",          name: "AI Matrix",          category: "Technology", bg: "linear-gradient(135deg,#000000 0%,#052e16 50%,#022c22 100%)", text: "#bbf7d0", accent: "#10b981" },
  { id: "QuantumFlow",       name: "Quantum Flow",       category: "Technology", bg: "linear-gradient(135deg,#0c0a3e 0%,#4338ca 50%,#7c3aed 100%)", text: "#ffffff", accent: "#67e8f9" },
  { id: "DigitalUniverse",   name: "Digital Universe",   category: "Technology", bg: "radial-gradient(ellipse at top,#1e1b4b 0%,#020617 70%)", text: "#ffffff", accent: "#a855f7" },
  { id: "DarkTech",          name: "Dark Tech",          category: "Technology", bg: "linear-gradient(135deg,#09090b 0%,#18181b 50%,#27272a 100%)", text: "#ffffff", accent: "#f59e0b" },
  { id: "CodeGrid",          name: "Code Grid",          category: "Technology", bg: "linear-gradient(135deg,#0a0a0a 0%,#171717 50%,#1f2937 100%)", text: "#d4d4d8", accent: "#34d399" },
  { id: "HolographicUI",     name: "Holographic UI",     category: "Technology", bg: "linear-gradient(135deg,#155e75 0%,#7c3aed 50%,#db2777 100%)", text: "#ffffff", accent: "#f0abfc" },
  { id: "FutureVision",      name: "Future Vision",      category: "Technology", bg: "linear-gradient(135deg,#020617 0%,#1e293b 50%,#0c4a6e 100%)", text: "#ffffff", accent: "#38bdf8" },
  { id: "TechGlass",         name: "Tech Glass",         category: "Technology", bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#312e81 100%)", text: "#ffffff", accent: "#60a5fa" },
  { id: "SiliconValley",     name: "Silicon Valley",     category: "Technology", bg: "linear-gradient(135deg,#fef3c7 0%,#fde68a 40%,#0ea5e9 100%)", text: "#0f172a", accent: "#1d4ed8" },

  // ============ BUSINESS ============
  { id: "CorporateBlack",    name: "Corporate Black",    category: "Business", bg: "linear-gradient(135deg,#000000 0%,#111111 50%,#1f1f1f 100%)", text: "#ffffff", accent: "#fbbf24" },
  { id: "LuxuryGold",        name: "Luxury Gold",        category: "Business", bg: "linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#3f2e0f 100%)", text: "#fde68a", accent: "#d4a017" },
  { id: "ExecutiveBlue",     name: "Executive Blue",     category: "Business", bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1e40af 100%)", text: "#ffffff", accent: "#93c5fd" },
  { id: "MinimalCEO",        name: "Minimal CEO",        category: "Business", bg: "linear-gradient(135deg,#ffffff 0%,#f1f5f9 50%,#e2e8f0 100%)", text: "#0f172a", accent: "#1f2937" },
  { id: "StartupPitch",      name: "Startup Pitch",      category: "Business", bg: "linear-gradient(135deg,#7c3aed 0%,#db2777 50%,#f97316 100%)", text: "#ffffff", accent: "#fef08a" },
  { id: "InvestorDeck",      name: "Investor Deck",      category: "Business", bg: "linear-gradient(135deg,#052e16 0%,#064e3b 50%,#0f766e 100%)", text: "#ecfeff", accent: "#facc15" },
  { id: "ModernOffice",      name: "Modern Office",      category: "Business", bg: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 50%,#cbd5e1 100%)", text: "#0f172a", accent: "#0369a1" },
  { id: "FinancePro",        name: "Finance Pro",        category: "Business", bg: "linear-gradient(135deg,#022c22 0%,#064e3b 50%,#1f2937 100%)", text: "#ffffff", accent: "#34d399" },
  { id: "ConsultingElite",   name: "Consulting Elite",   category: "Business", bg: "linear-gradient(135deg,#1e293b 0%,#334155 50%,#475569 100%)", text: "#ffffff", accent: "#fb7185" },
  { id: "ProductLaunch",     name: "Product Launch",     category: "Business", bg: "linear-gradient(135deg,#831843 0%,#9d174d 50%,#dc2626 100%)", text: "#ffffff", accent: "#fde68a" },

  // ============ CREATIVE ============
  { id: "Aurora",            name: "Aurora",             category: "Creative", bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 35%,#7c3aed 70%,#db2777 100%)", text: "#ffffff", accent: "#5eead4" },
  { id: "OceanWaves",        name: "Ocean Waves",        category: "Creative", bg: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 40%,#22d3ee 100%)", text: "#ffffff", accent: "#fef9c3" },
  { id: "CrystalGlass",      name: "Crystal Glass",      category: "Creative", bg: "linear-gradient(135deg,#a5f3fc 0%,#c4b5fd 50%,#f0abfc 100%)", text: "#1e1b4b", accent: "#7c3aed" },
  { id: "GalaxyMotion",      name: "Galaxy Motion",      category: "Creative", bg: "radial-gradient(ellipse at top,#312e81 0%,#020617 60%)", text: "#ffffff", accent: "#f0abfc" },
  { id: "NorthernLights",    name: "Northern Lights",    category: "Creative", bg: "linear-gradient(135deg,#022c22 0%,#0f766e 40%,#7c3aed 100%)", text: "#ffffff", accent: "#a7f3d0" },
  { id: "DreamCanvas",       name: "Dream Canvas",       category: "Creative", bg: "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 50%,#c4b5fd 100%)", text: "#1e1b4b", accent: "#be185d" },
  { id: "InkSplash",         name: "Ink Splash",         category: "Creative", bg: "linear-gradient(135deg,#fafaf9 0%,#e7e5e4 50%,#a8a29e 100%)", text: "#0a0a0a", accent: "#dc2626" },
  { id: "LiquidGradient",    name: "Liquid Gradient",    category: "Creative", bg: "linear-gradient(135deg,#f97316 0%,#db2777 50%,#7c3aed 100%)", text: "#ffffff", accent: "#fef08a" },
  { id: "AbstractFlow",      name: "Abstract Flow",      category: "Creative", bg: "linear-gradient(135deg,#10b981 0%,#06b6d4 50%,#6366f1 100%)", text: "#ffffff", accent: "#fef08a" },
  { id: "PaperArt",          name: "Paper Art",          category: "Creative", bg: "linear-gradient(135deg,#fef3c7 0%,#fde68a 50%,#fca5a5 100%)", text: "#1f2937", accent: "#9f1239" },

  // ============ ANIMATED (premium) ============
  { id: "GlassMorph3D",      name: "3D Glass",           category: "Animated", bg: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#4c1d95 100%)", text: "#ffffff", accent: "#a78bfa" },
  { id: "FloatingIslands",   name: "Floating Islands",   category: "Animated", bg: "linear-gradient(135deg,#082f49 0%,#155e75 50%,#a16207 100%)", text: "#ffffff", accent: "#fde047" },
  { id: "ParticleUniverse",  name: "Particle Universe",  category: "Animated", bg: "radial-gradient(circle at 30% 30%,#1e1b4b,#020617 70%)", text: "#ffffff", accent: "#22d3ee" },
  { id: "SpaceJourney",      name: "Space Journey",      category: "Animated", bg: "radial-gradient(ellipse at bottom,#1e293b 0%,#000000 70%)", text: "#ffffff", accent: "#fb923c" },
  { id: "InfiniteZoom",      name: "Infinite Zoom",      category: "Animated", bg: "radial-gradient(circle,#312e81 0%,#020617 80%)", text: "#ffffff", accent: "#f0abfc" },
  { id: "LiquidMotion",      name: "Liquid Motion",      category: "Animated", bg: "linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 50%,#ec4899 100%)", text: "#ffffff", accent: "#fef9c3" },
  { id: "NeonPulse",         name: "Neon Pulse",         category: "Animated", bg: "linear-gradient(135deg,#020617 0%,#1e1b4b 50%,#db2777 100%)", text: "#ffffff", accent: "#22d3ee" },
  { id: "Hologram",          name: "Hologram",           category: "Animated", bg: "linear-gradient(135deg,#0e7490 0%,#7c3aed 50%,#db2777 100%)", text: "#ffffff", accent: "#bef264" },
  { id: "MorphFlow",         name: "Morph Flow",         category: "Animated", bg: "linear-gradient(135deg,#1e1b4b 0%,#7c3aed 50%,#f97316 100%)", text: "#ffffff", accent: "#fef08a" },
  { id: "CinematicMotion",   name: "Cinematic Motion",   category: "Animated", bg: "linear-gradient(135deg,#000000 0%,#1f2937 50%,#7c2d12 100%)", text: "#ffffff", accent: "#f59e0b" },

  // ============ MINIMAL ============
  { id: "MinimalSnow",       name: "Minimal Snow",       category: "Minimal", bg: "linear-gradient(135deg,#ffffff 0%,#fafafa 100%)", text: "#0a0a0a", accent: "#0a0a0a" },
  { id: "MinimalSlate",      name: "Minimal Slate",      category: "Minimal", bg: "linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%)", text: "#0f172a", accent: "#475569" },
  { id: "MinimalSand",       name: "Minimal Sand",       category: "Minimal", bg: "linear-gradient(135deg,#fafaf9 0%,#f5f5f4 100%)", text: "#1c1917", accent: "#a16207" },
  { id: "MinimalMono",       name: "Minimal Mono",       category: "Minimal", bg: "linear-gradient(135deg,#fafafa 0%,#e5e5e5 100%)", text: "#171717", accent: "#dc2626" },
  { id: "MinimalMint",       name: "Minimal Mint",       category: "Minimal", bg: "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)", text: "#052e16", accent: "#15803d" },
  { id: "MinimalSky",        name: "Minimal Sky",        category: "Minimal", bg: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)", text: "#0c4a6e", accent: "#0284c7" },
  { id: "MinimalRose",       name: "Minimal Rose",       category: "Minimal", bg: "linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%)", text: "#881337", accent: "#be123c" },
  { id: "MinimalLinen",      name: "Minimal Linen",      category: "Minimal", bg: "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)", text: "#1c1917", accent: "#854d0e" },

  // ============ DARK ============
  { id: "DarkVoid",          name: "Dark Void",          category: "Dark", bg: "linear-gradient(135deg,#000000 0%,#0a0a0a 100%)", text: "#fafafa", accent: "#f59e0b" },
  { id: "DarkInk",           name: "Dark Ink",           category: "Dark", bg: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", text: "#f1f5f9", accent: "#60a5fa" },
  { id: "DarkForest",        name: "Dark Forest",        category: "Dark", bg: "linear-gradient(135deg,#022c22 0%,#052e16 100%)", text: "#ecfdf5", accent: "#a3e635" },
  { id: "DarkRoyal",         name: "Dark Royal",         category: "Dark", bg: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)", text: "#e0e7ff", accent: "#fbbf24" },
  { id: "DarkCarbon",        name: "Dark Carbon",        category: "Dark", bg: "linear-gradient(135deg,#18181b 0%,#27272a 100%)", text: "#f4f4f5", accent: "#22d3ee" },
  { id: "DarkBlood",         name: "Dark Blood",         category: "Dark", bg: "linear-gradient(135deg,#1a0a0a 0%,#3f1212 100%)", text: "#fef2f2", accent: "#fb7185" },
  { id: "DarkAmber",         name: "Dark Amber",         category: "Dark", bg: "linear-gradient(135deg,#1c1917 0%,#451a03 100%)", text: "#fef3c7", accent: "#f59e0b" },
  { id: "DarkOcean",         name: "Dark Ocean",         category: "Dark", bg: "linear-gradient(135deg,#082f49 0%,#0c4a6e 100%)", text: "#e0f2fe", accent: "#22d3ee" },

  // ============ LIGHT ============
  { id: "LightAir",          name: "Light Air",          category: "Light", bg: "linear-gradient(135deg,#ffffff 0%,#f9fafb 100%)", text: "#111827", accent: "#3b82f6" },
  { id: "LightPearl",        name: "Light Pearl",        category: "Light", bg: "linear-gradient(135deg,#fafafa 0%,#f3f4f6 100%)", text: "#1f2937", accent: "#a855f7" },
  { id: "LightLemon",        name: "Light Lemon",        category: "Light", bg: "linear-gradient(135deg,#fefce8 0%,#fef9c3 100%)", text: "#1f2937", accent: "#a16207" },
  { id: "LightLavender",     name: "Light Lavender",     category: "Light", bg: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)", text: "#1e1b4b", accent: "#7c3aed" },
  { id: "LightCoral",        name: "Light Coral",        category: "Light", bg: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)", text: "#7c2d12", accent: "#ea580c" },
  { id: "LightMatcha",       name: "Light Matcha",       category: "Light", bg: "linear-gradient(135deg,#f7fee7 0%,#ecfccb 100%)", text: "#1a2e05", accent: "#65a30d" },
  { id: "LightCloud",        name: "Light Cloud",        category: "Light", bg: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 60%,#ffffff 100%)", text: "#0c4a6e", accent: "#0ea5e9" },
  { id: "LightCream",        name: "Light Cream",        category: "Light", bg: "linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)", text: "#451a03", accent: "#b45309" },
];

// Backwards-compatible small set used by existing pickers
export const THEMES = THEMES_CATALOG;

// ---------- Smart suggestions ----------
export function smartSuggestThemes(input: {
  type?: string; audience?: string; topic?: string;
}): PresentationTheme[] {
  const text = `${input.type ?? ""} ${input.audience ?? ""} ${input.topic ?? ""}`.toLowerCase();
  const score = (t: PresentationTheme) => {
    let s = 0;
    const hay = `${t.name} ${t.category} ${t.vibe ?? ""}`.toLowerCase();
    const tokens = ["medical","science","engineer","research","seminar","college","university","math","quantum","cyber","ai","tech","code","startup","pitch","invest","finance","corporate","creative","design","art","minimal","luxury","gold","dark","light","glass","aurora","ocean","space","neon"];
    for (const tok of tokens) if (text.includes(tok) && hay.includes(tok)) s += 3;
    if (text.includes("school") && t.category === "Education") s += 2;
    if (text.includes("business") && t.category === "Business") s += 2;
    if (text.includes("research") && (t.category === "Education" || t.id === "ResearchModern")) s += 2;
    if (text.includes("startup") && t.id === "StartupPitch") s += 4;
    if (text.includes("medical") && t.id === "MedicalWhite") s += 4;
    return s;
  };
  return [...THEMES_CATALOG].sort((a, b) => score(b) - score(a)).slice(0, 8);
}

// ---------- Surprise Me (client-side random theme) ----------
const PALETTES: Array<{ a: string; b: string; c: string; accent: string; text: string }> = [
  { a: "#0f172a", b: "#1e1b4b", c: "#7c3aed", accent: "#22d3ee", text: "#ffffff" },
  { a: "#020617", b: "#0c4a6e", c: "#0ea5e9", accent: "#fde68a", text: "#ffffff" },
  { a: "#1a0a0a", b: "#7f1d1d", c: "#f97316", accent: "#fef08a", text: "#ffffff" },
  { a: "#052e16", b: "#0f766e", c: "#10b981", accent: "#fde047", text: "#ffffff" },
  { a: "#fdf2f8", b: "#fce7f3", c: "#c4b5fd", accent: "#7c3aed", text: "#1e1b4b" },
  { a: "#ffffff", b: "#f1f5f9", c: "#e0e7ff", accent: "#4338ca", text: "#0f172a" },
  { a: "#000000", b: "#1f1f1f", c: "#3f2e0f", accent: "#d4a017", text: "#fde68a" },
  { a: "#0e7490", b: "#7c3aed", c: "#db2777", accent: "#bef264", text: "#ffffff" },
];
export function surpriseMeTheme(seed = Date.now()): PresentationTheme {
  const p = PALETTES[seed % PALETTES.length];
  const angle = (seed * 37) % 360;
  return {
    id: `Surprise-${seed.toString(36)}`,
    name: "Surprise Theme",
    category: "Custom",
    bg: `linear-gradient(${angle}deg, ${p.a} 0%, ${p.b} 50%, ${p.c} 100%)`,
    text: p.text,
    accent: p.accent,
    vibe: "AI-randomized",
  };
}

// ---------- Helper to render theme bg ----------
export function themeBackground(theme: { grad?: string; bg?: string }): {
  className: string; style: React.CSSProperties;
} {
  if (theme.bg) return { className: "", style: { background: theme.bg } };
  if (theme.grad) return { className: `bg-gradient-to-br ${theme.grad}`, style: {} };
  return { className: "bg-slate-900", style: {} };
}
