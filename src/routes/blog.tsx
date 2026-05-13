import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Clock } from "lucide-react";
import { blogPosts, categories } from "@/lib/blog-data";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Resources — Nexoras" },
      { name: "description", content: "Long-form guides on AI study tools, productivity systems, resume building, automation, and student careers — written by the Nexoras team." },
      { property: "og:title", content: "Nexoras Blog — Guides for Students & Early Careers" },
      { property: "og:description", content: "In-depth articles on AI, productivity, resume building, and automation for students and freshers." },
    ],
  }),
  component: Blog,
});

function Blog() {
  const [active, setActive] = useState<string>("All");
  const list = active === "All" ? blogPosts : blogPosts.filter((p) => p.category === active);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nexoras Blog"
        title="Guides that make you sharper"
        description="Long-form, original articles on AI study tools, productivity, resume building, automation, and careers — written for students and early-career professionals."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => (
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
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
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
        </div>
      </section>
    </PageShell>
  );
}
