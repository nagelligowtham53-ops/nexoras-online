import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Clock } from "lucide-react";
import { fetchAllPosts, ALL_CATEGORIES, type BlogCategory } from "@/lib/blog-store";

function fromSlug(slug: string): BlogCategory | null {
  const match = ALL_CATEGORIES.find(
    (c) => c.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase(),
  );
  return match ?? null;
}

export const Route = createFileRoute("/blog/category/$cat")({
  loader: async ({ params }) => {
    const cat = fromSlug(params.cat);
    if (!cat) throw notFound();
    const all = await fetchAllPosts();
    return { cat, posts: all.filter((p) => p.category === cat) };
  },
  head: ({ loaderData, params }) => {
    const cat = loaderData?.cat ?? params.cat;
    const title = `${cat} articles — Nexoras Blog`;
    const description = `Articles on ${cat} for Indian and international students — exam prep, study plans, interviews, careers, and AI productivity.`;
    const url = `https://nexoras.online/blog/category/${params.cat}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: Category,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Category not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-accent">← Back to blog</Link>
      </div>
    </PageShell>
  ),
});

function Category() {
  const { cat, posts } = Route.useLoaderData();
  return (
    <PageShell>
      <PageHeader
        eyebrow={`Category · ${cat}`}
        title={`${cat} articles`}
        description={`Curated, original ${cat.toLowerCase()} guides — refreshed weekly.`}
      />
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No articles yet — check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: any) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="glass group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <h2 className="font-display text-lg font-semibold leading-snug group-hover:text-accent">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {p.readTime} read · {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-10 text-xs text-muted-foreground">
          <Link to="/blog" className="text-accent hover:underline">← All categories</Link>
        </p>
      </section>
    </PageShell>
  );
}
