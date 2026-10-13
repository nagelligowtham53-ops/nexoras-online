import { readAIRequest, invalidAIRequest } from "@/lib/ai-request";
import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAILS } from "@/lib/premium";

type Action =
  | { action: "list" }
  | { action: "get"; slug: string }
  | { action: "save"; post: PostInput }
  | { action: "delete"; id: string }
  | { action: "generate"; topic?: string; category?: string };

type PostInput = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author?: string;
  read_time?: string;
  cover?: string | null;
  content: unknown;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  status: "draft" | "scheduled" | "published";
  scheduled_for?: string | null;
};

async function requireAdmin(request: Request): Promise<{ email: string; userId: string } | Response> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ error: "Auth not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7).trim();
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = data.user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return { email, userId: data.user.id };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function generateArticle(
  topic: string | undefined,
  category: string | undefined,
  userId: string,
): Promise<PostInput | { error: string; status: number }> {
  const cat = category || "Exams";
  const seedTopic =
    topic?.slice(0, 500) ||
    "trending Indian competitive exam preparation strategy for the upcoming month";
  const prompt = `Write a high-quality, original SEO blog article for Nexoras (an AI-powered exam-prep and career platform for Indian and international students).

Topic seed: ${seedTopic}
Category: ${cat}

Return STRICT JSON only, no markdown, shape:
{
  "title": "60-char compelling SEO title with primary keyword",
  "slug": "kebab-case-url-slug",
  "description": "150-char meta description hook",
  "meta_title": "<=60 char title tag",
  "meta_description": "<=160 char meta description",
  "tags": ["3-6","short","tags"],
  "read_time": "X min",
  "content": [
    { "type": "p", "text": "intro paragraph" },
    { "type": "h2", "text": "Section heading" },
    { "type": "p", "text": "..." },
    { "type": "ul", "items": ["...","..."] }
  ]
}

Rules:
- 900-1300 words total across content blocks.
- Use ONLY block types: "p" | "h2" | "h3" | "ul" | "quote".
- For "ul" blocks include an "items" string array; do not include "text".
- Use a clear H2 structure (5-8 H2 sections), short paragraphs, scannable lists.
- Concrete, actionable advice for students. No fluff. No emojis.
- Naturally weave 1-2 internal links by mentioning Nexoras pages: /mock-tests, /mock-interview, /roadmaps, /competitive-exams, /resume — as plain text references like "(see /mock-tests)" inside paragraphs.
- No images. No HTML. No code fences. JSON only.`;

  let content: string;
  try {
    const { geminiText } = await import("@/lib/gemini.server");
    content = await geminiText(userId, { system: "You are an education editor. Output valid JSON only. Never invent founder facts, credentials, official exam rules, or current news.", contents: prompt, json: true });
  } catch (error) {
    const { safeAIError } = await import("@/lib/ai-errors");
    const safe = safeAIError(error);
    return { error: safe.message, status: safe.status };
  }
  let parsed: Partial<PostInput> & { content?: unknown } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        /* noop */
      }
    }
  }
  if (!parsed.title || !parsed.content) {
    return { error: "AI returned malformed article", status: 502 };
  }
  const slug = slugify(parsed.slug || parsed.title);
  return {
    slug,
    title: String(parsed.title).slice(0, 120),
    description: String(parsed.description ?? "").slice(0, 200),
    category: cat,
    author: "Nexoras Team",
    read_time: String(parsed.read_time ?? "6 min").slice(0, 12),
    cover: null,
    content: parsed.content,
    meta_title: parsed.meta_title ? String(parsed.meta_title).slice(0, 70) : null,
    meta_description: parsed.meta_description
      ? String(parsed.meta_description).slice(0, 180)
      : null,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
    status: "draft",
  };
}

export const Route = createFileRoute("/api/blog-admin")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const admin = await requireAdmin(request);
        if (admin instanceof Response) return admin;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let body: Action;
        try {
          body = (await request.json()) as Action;
        } catch (error) {
          return invalidAIRequest(error);
        }

        if (body.action === "list") {
          const { data, error } = await supabaseAdmin
            .from("blog_posts")
            .select("*")
            .order("updated_at", { ascending: false });
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ posts: data ?? [] });
        }

        if (body.action === "get") {
          const { data, error } = await supabaseAdmin
            .from("blog_posts")
            .select("*")
            .eq("slug", body.slug)
            .maybeSingle();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ post: data });
        }

        if (body.action === "save") {
          const p = body.post;
          if (!p?.title || !p?.slug)
            return Response.json({ error: "Title & slug required" }, { status: 400 });
          const row = {
            slug: slugify(p.slug),
            title: p.title.slice(0, 200),
            description: (p.description ?? "").slice(0, 300),
            category: p.category || "AI",
            author: p.author || "Nexoras Team",
            read_time: p.read_time || "6 min",
            cover: p.cover ?? null,
            content: (p.content ?? []) as never,
            meta_title: p.meta_title ?? null,
            meta_description: p.meta_description ?? null,
            tags: p.tags ?? [],
            status: p.status,
            scheduled_for: p.scheduled_for ?? null,
            published_at:
              p.status === "published" ? new Date().toISOString() : null,
          };
          const q = p.id
            ? supabaseAdmin.from("blog_posts").update(row).eq("id", p.id).select().maybeSingle()
            : supabaseAdmin.from("blog_posts").insert(row).select().maybeSingle();
          const { data, error } = await q;
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ post: data });
        }

        if (body.action === "delete") {
          const { error } = await supabaseAdmin
            .from("blog_posts")
            .delete()
            .eq("id", body.id);
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        }

        if (body.action === "generate") {
          const result = await generateArticle(body.topic, body.category, admin.userId);
          if ("error" in result)
            return Response.json({ error: result.error }, { status: result.status });
          return Response.json({ draft: result });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
