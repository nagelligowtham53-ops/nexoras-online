import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Clock } from "lucide-react";
import { fetchAllPosts, ALL_CATEGORIES } from "@/lib/blog-store";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Resources — Nexoras" },
      { name: "description", content: "Long-form guides on AI study tools, exam preparation, productivity, resume building, automation, and student careers — written and curated by the Nexoras team." },
      { property: "og:title", content: "Nexoras Blog — Guides for Students & Early Careers" },
      { property: "og:description", content: "In-depth articles on AI, exam prep, productivity, resume building, and automation for students and freshers." },
      { property: "og:url", content: "https://nexoras.online/blog" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/blog" }],
  }),
  loader: async () => ({ posts: await fetchAllPosts() }),
  component: Blog,
});

function Blog() {
  const { posts } = Route.useLoaderData();
  const [active, setActive] = useState<string>("All");
  const present = Array.from(new Set(posts.map((p: any) => p.category)));
  const tabs = ["All", ...ALL_CATEGORIES.filter((c) => present.includes(c))];
  const list = active === "All" ? posts : posts.filter((p: any) => p.category === active);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nexoras Blog"
        title="Guides that make you sharper"
        description="Long-form articles on AI study tools, exam preparation, productivity, resume building, and careers — written for students and early-career professionals. Fresh content every week."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active === c
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          {ALL_CATEGORIES.filter((c) => present.includes(c)).map((c) => (
            <Link
              key={`link-${c}`}
              to="/blog/category/$cat"
              params={{ cat: c.toLowerCase().replace(/\s+/g, "-") }}
              className="rounded-full border border-border/60 bg-transparent px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              /{c.toLowerCase().replace(/\s+/g, "-")}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p: any) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="glass group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs uppercase tracking-wider text-accent">
                {p.category}
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold leading-snug group-hover:text-accent">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {p.readTime} read · {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </Link>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">No articles in this category yet.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
