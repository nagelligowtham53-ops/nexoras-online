// Client-side helpers for AI Presentation Studio:
// BYO API keys, provider switch, response cache, daily rate limit, usage tracking.

export type AIProvider = "groq" | "openai" | "anthropic" | "gemini";

export interface PresentationAISettings {
  provider: AIProvider;
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  dailyLimit: number; // generations per day
}

const SETTINGS_KEY = "nx_pres_ai_settings_v1";
const USAGE_KEY = "nx_pres_ai_usage_v1";
const CACHE_KEY = "nx_pres_ai_cache_v1";
const CACHE_MAX = 20;

export const DEFAULT_SETTINGS: PresentationAISettings = {
  provider: "groq",
  openaiKey: "",
  anthropicKey: "",
  geminiKey: "",
  dailyLimit: 20,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadSettings(): PresentationAISettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

export function saveSettings(s: PresentationAISettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function activeKey(s: PresentationAISettings): string {
  if (s.provider === "openai") return s.openaiKey.trim();
  if (s.provider === "anthropic") return s.anthropicKey.trim();
  if (s.provider === "gemini") return s.geminiKey.trim();
  return "";
}

// ---------------- Usage / rate limit ----------------
interface UsageRecord { date: string; count: number; total: number; }

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function getUsage(): UsageRecord {
  if (typeof window === "undefined") return { date: todayStr(), count: 0, total: 0 };
  const rec = safeParse<UsageRecord>(localStorage.getItem(USAGE_KEY), { date: todayStr(), count: 0, total: 0 });
  if (rec.date !== todayStr()) return { date: todayStr(), count: 0, total: rec.total };
  return rec;
}

export function recordUsage() {
  if (typeof window === "undefined") return;
  const cur = getUsage();
  const next: UsageRecord = { date: todayStr(), count: cur.count + 1, total: cur.total + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
}

export function checkRateLimit(s: PresentationAISettings): { ok: boolean; remaining: number } {
  // BYO keys are not rate-limited locally (the user owns the bill)
  if (s.provider !== "groq") return { ok: true, remaining: Infinity };
  const u = getUsage();
  const remaining = Math.max(0, s.dailyLimit - u.count);
  return { ok: remaining > 0, remaining };
}

// ---------------- Cache ----------------
interface CacheEntry { key: string; at: number; data: unknown; }

async function hashKey(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  }
  let h = 0; for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return String(h);
}

export async function buildCacheKey(payload: Record<string, unknown>): Promise<string> {
  return hashKey(JSON.stringify(payload));
}

export function getCached(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  const list = safeParse<CacheEntry[]>(localStorage.getItem(CACHE_KEY), []);
  const hit = list.find(e => e.key === key);
  return hit ? hit.data : null;
}

export function setCached(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  const list = safeParse<CacheEntry[]>(localStorage.getItem(CACHE_KEY), [])
    .filter(e => e.key !== key);
  list.unshift({ key, at: Date.now(), data });
  while (list.length > CACHE_MAX) list.pop();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); }
  catch { /* quota */ localStorage.setItem(CACHE_KEY, JSON.stringify(list.slice(0, 5))); }
}

export function clearCache() {
  if (typeof window !== "undefined") localStorage.removeItem(CACHE_KEY);
}

export function cacheSize(): number {
  if (typeof window === "undefined") return 0;
  return safeParse<CacheEntry[]>(localStorage.getItem(CACHE_KEY), []).length;
}
