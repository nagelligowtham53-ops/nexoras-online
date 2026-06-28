import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cron hook: publishes any scheduled posts whose time has come,
// and (optionally) generates a fresh weekly draft on a rotating topic.
// Configure pg_cron to POST here weekly. Open endpoint (read-only effect on
// drafts/published rows in our own table) — keep at /api/public/.

const WEEKLY_TOPICS: { topic: string; category: string }[] = [
  { topic: "JEE Main last-month preparation strategy", category: "Exams" },
  { topic: "NEET biology high-yield revision plan", category: "Study Plans" },
  { topic: "Common HR interview questions for freshers with sample answers", category: "Interview" },
  { topic: "GATE CSE roadmap for working professionals", category: "Career" },
  { topic: "How to use AI tools to study smarter without losing focus", category: "AI" },
  { topic: "UPSC prelims time-management techniques that actually work", category: "Exams" },
  { topic: "CAT quant shortcuts every aspirant should know", category: "Exams" },
  { topic: "Building a developer resume that survives ATS screening", category: "Resume" },
  { topic: "Weekly study planner template for class 12 board + JEE", category: "Study Plans" },
  { topic: "Top 10 product-manager interview questions for fresh graduates", category: "Interview" },
  { topic: "Career roadmap: AI/ML engineer in 12 months", category: "Career" },
  { topic: "Daily productivity routine for serious exam aspirants", category: "Productivity" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function publishDue() {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .select("id,slug");
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function generateWeeklyDraft() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { skipped: "no api key" };

  // Rotate topic by ISO week number for deterministic variety.
  const now = new Date();
  const week = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), 0, 1)) /
      (7 * 86400000),
  );
  const pick = WEEKLY_TOPICS[week % WEEKLY_TOPICS.length];

  const prompt = `Write a high-quality, original SEO blog article for Nexoras (AI-powered exam-prep & career platform for Indian and international students).
Topic seed: ${pick.topic}
Category: ${pick.category}

Return STRICT JSON only, shape:
{ "title": "...", "slug": "kebab", "description": "...", "meta_title": "...", "meta_description": "...", "tags": ["..."], "read_time": "X min",
  "content": [ {"type":"p","text":"..."}, {"type":"h2","text":"..."}, {"type":"ul","items":["..."]} ] }

Rules: 900-1300 words, only block types p/h2/h3/ul/quote, ul blocks use items[], no markdown/HTML/images, mention internal pages like /mock-tests /mock-interview /roadmaps /competitive-exams /resume naturally inside paragraphs.`;

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert education SEO writer. JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  }).catch(() => null);
  if (!r || !r.ok) return { skipped: `ai ${r?.status}` };
  const j = (await r.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null;
  const content = j?.choices?.[0]?.message?.content ?? "";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
  }
  const title = String(parsed.title ?? "");
  if (!title || !parsed.content) return { skipped: "malformed" };
  const slug = slugify(String(parsed.slug ?? title));

  // Schedule for next Monday 09:00 UTC.
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + ((1 + 7 - next.getUTCDay()) % 7 || 7));
  next.setUTCHours(9, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .upsert(
      {
        slug,
        title: title.slice(0, 200),
        description: String(parsed.description ?? "").slice(0, 300),
        category: pick.category,
        author: "Nexoras Team",
        read_time: String(parsed.read_time ?? "7 min").slice(0, 12),
        content: parsed.content as never,
        meta_title: parsed.meta_title ? String(parsed.meta_title).slice(0, 70) : null,
        meta_description: parsed.meta_description
          ? String(parsed.meta_description).slice(0, 180)
          : null,
        tags: Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).slice(0, 8).map(String) : [],
        status: "scheduled",
        scheduled_for: next.toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id,slug,scheduled_for")
    .maybeSingle();
  if (error) return { error: error.message };
  return { drafted: data };
}

export const Route = createFileRoute("/api/public/hooks/publish-scheduled")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const published = await publishDue();
          const drafted = await generateWeeklyDraft();
          return Response.json({ ok: true, published, drafted });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
      GET: async () => {
        try {
          const published = await publishDue();
          return Response.json({ ok: true, published });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
