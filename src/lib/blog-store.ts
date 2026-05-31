// Unified blog data layer. Merges seeded static posts (src/lib/blog-data.ts)
// with dynamic AI-generated posts stored in the `blog_posts` table.
// Safe to call from route loaders (SSR + browser).
import { supabase } from "@/integrations/supabase/client";
import { blogPosts as staticPosts, type BlogPost } from "@/lib/blog-data";

export const ALL_CATEGORIES = [
  "AI",
  "Productivity",
  "Resume",
  "Automation",
  "Career",
  "Exams",
  "Study Plans",
  "Interview",
] as const;
export type BlogCategory = (typeof ALL_CATEGORIES)[number];

type DbRow = {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  read_time: string;
  cover: string | null;
  content: BlogPost["content"];
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
};

export type FullPost = BlogPost & {
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  source: "static" | "ai";
};

function rowToPost(r: DbRow): FullPost {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category as BlogPost["category"],
    author: r.author,
    date: (r.published_at ?? r.scheduled_for ?? r.created_at).slice(0, 10),
    readTime: r.read_time,
    cover: r.cover ?? undefined,
    content: Array.isArray(r.content) ? r.content : [],
    metaTitle: r.meta_title ?? undefined,
    metaDescription: r.meta_description ?? undefined,
    tags: r.tags ?? [],
    source: "ai",
  };
}

function staticAsFull(p: BlogPost): FullPost {
  return { ...p, source: "static" };
}

export async function fetchAllPosts(): Promise<FullPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug,title,description,category,author,read_time,cover,content,meta_title,meta_description,tags,status,scheduled_for,published_at,created_at",
    )
    .order("published_at", { ascending: false, nullsFirst: false });
  const dbPosts = !error && data ? (data as unknown as DbRow[]).map(rowToPost) : [];
  // Static posts as fallback; DB slug wins if duplicate.
  const seen = new Set(dbPosts.map((p) => p.slug));
  const merged = [
    ...dbPosts,
    ...staticPosts.filter((p) => !seen.has(p.slug)).map(staticAsFull),
  ];
  merged.sort((a, b) => (a.date < b.date ? 1 : -1));
  return merged;
}

export async function fetchPost(slug: string): Promise<FullPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug,title,description,category,author,read_time,cover,content,meta_title,meta_description,tags,status,scheduled_for,published_at,created_at",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!error && data) return rowToPost(data as unknown as DbRow);
  const fallback = staticPosts.find((p) => p.slug === slug);
  return fallback ? staticAsFull(fallback) : null;
}
