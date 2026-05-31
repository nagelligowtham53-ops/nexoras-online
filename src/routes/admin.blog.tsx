import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Save, Trash2, Plus, ExternalLink, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/premium";
import { authedFetch } from "@/lib/authed-fetch";
import { toast } from "sonner";
import { ALL_CATEGORIES } from "@/lib/blog-store";

type DbPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  read_time: string;
  cover: string | null;
  content: { type: string; text?: string; items?: string[] }[];
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  status: "draft" | "scheduled" | "published";
  scheduled_for: string | null;
  published_at: string | null;
  updated_at: string;
};

export const Route = createFileRoute("/admin/blog")({
  head: () => ({
    meta: [
      { title: "Blog admin — Nexoras" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminBlog,
});

const empty: DbPost = {
  id: "",
  slug: "",
  title: "",
  description: "",
  category: "AI",
  author: "Nexoras Team",
  read_time: "6 min",
  cover: null,
  content: [],
  meta_title: null,
  meta_description: null,
  tags: [],
  status: "draft",
  scheduled_for: null,
  published_at: null,
  updated_at: "",
};

function AdminBlog() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<DbPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [seedTopic, setSeedTopic] = useState("");
  const [seedCategory, setSeedCategory] = useState<string>("Exams");

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/blog-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setPosts(j.posts ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  const contentText = useMemo(
    () => (editing ? JSON.stringify(editing.content, null, 2) : ""),
    [editing],
  );

  if (authLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </PageShell>
    );
  }
  if (!isAdmin) {
    return (
      <PageShell>
        <PageHeader title="Admins only" description="This page is restricted to Nexoras editors." />
        <div className="mx-auto max-w-2xl px-4 pb-20">
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email ?? "unknown"}. <Link to="/" className="text-accent">Go home</Link>
          </p>
        </div>
      </PageShell>
    );
  }

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await authedFetch("/api/blog-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic: seedTopic || undefined,
          category: seedCategory,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Generation failed");
      setEditing({ ...empty, ...j.draft, id: "", status: "draft", updated_at: "" });
      toast.success("Draft generated — review & save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      let content = editing.content;
      try {
        const parsed = JSON.parse(contentTextarea.value);
        if (Array.isArray(parsed)) content = parsed;
      } catch {
        /* keep existing */
      }
      const payload = { ...editing, content };
      const res = await authedFetch("/api/blog-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", post: payload }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      toast.success("Saved");
      setEditing(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    const res = await authedFetch("/api/blog-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (res.ok) { toast.success("Deleted"); refresh(); }
    else toast.error("Delete failed");
  };

  let contentTextarea!: HTMLTextAreaElement;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Blog CMS"
        description="Create, edit, schedule, and generate AI-assisted articles. Posts go live automatically at their scheduled time."
      />
      <section className="mx-auto max-w-6xl px-4 pb-24 lg:px-8">
        <Card className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs text-muted-foreground">Topic seed (optional)</label>
              <Input value={seedTopic} onChange={(e) => setSeedTopic(e.target.value)} placeholder="e.g. NEET biology revision schedule" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={seedCategory}
                onChange={(e) => setSeedCategory(e.target.value)}
                className="block h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate draft
            </Button>
            <Button variant="outline" onClick={() => setEditing({ ...empty })}>
              <Plus className="h-4 w-4" /> Blank post
            </Button>
          </div>
        </Card>

        {editing && (
          <Card className="mt-6 p-5">
            <h2 className="font-display text-lg font-semibold">{editing.id ? "Edit" : "New"} article</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Slug</label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="kebab-case" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="block h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Meta title</label>
                <Input value={editing.meta_title ?? ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Read time</label>
                <Input value={editing.read_time} onChange={(e) => setEditing({ ...editing, read_time: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Meta description</label>
                <Textarea rows={2} value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
                <Input
                  value={editing.tags.join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Content (JSON blocks: p / h2 / h3 / ul / quote)</label>
                <Textarea
                  ref={(el) => { if (el) contentTextarea = el; }}
                  rows={14}
                  defaultValue={contentText}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as DbPost["status"] })}
                  className="block h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Scheduled for (UTC)</label>
                <Input
                  type="datetime-local"
                  value={editing.scheduled_for ? editing.scheduled_for.slice(0, 16) : ""}
                  onChange={(e) => setEditing({ ...editing, scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All posts</h2>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            {posts.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  p.status === "published" ? "bg-emerald-500/15 text-emerald-400" :
                  p.status === "scheduled" ? "bg-amber-500/15 text-amber-400" :
                  "bg-secondary text-muted-foreground"
                }`}>{p.status}</span>
                <span className="text-[10px] uppercase tracking-wider text-accent">{p.category}</span>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium leading-snug">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">/{p.slug}{p.scheduled_for && p.status === "scheduled" ? ` · ${new Date(p.scheduled_for).toLocaleString()}` : ""}</p>
                </div>
                {p.status === "published" && (
                  <Link to="/blog/$slug" params={{ slug: p.slug }} target="_blank" className="text-xs text-muted-foreground hover:text-foreground">
                    <ExternalLink className="inline h-3 w-3" /> View
                  </Link>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Card>
            ))}
            {posts.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No posts yet. Generate one above.</p>
            )}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            <Calendar className="inline h-3 w-3" /> Scheduled posts auto-publish via the weekly cron at <code>/api/public/hooks/publish-scheduled</code>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
