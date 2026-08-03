import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { fetchPost, fetchAllPosts } from "@/lib/blog-store";
import type { BlogPost } from "@/lib/blog-data";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug);
    if (!post) throw notFound();
    const all = await fetchAllPosts();
    const related = all
      .filter((p) => p.category === post.category && p.slug !== post.slug)
      .slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Article — Nexoras" }] };
    const url = `https://nexoras.online/blog/${params.slug}`;
    const title = post.metaTitle ?? `${post.title} — Nexoras Blog`;
    const description = post.metaDescription ?? post.description;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "author", content: post.author },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.category },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.date,
            articleSection: post.category,
            mainEntityOfPage: url,
            publisher: { "@type": "Organization", name: "Nexoras" },
          }),
        },
      ],
    };
  },
  component: Article,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-accent">← Back to blog</Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Couldn't load this article</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
});

function Article() {
  const { post, related } = Route.useLoaderData();

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Link
            to="/blog/category/$cat"
            params={{ cat: post.category.toLowerCase().replace(/\s+/g, "-") }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 uppercase tracking-wider text-accent hover:bg-accent/10"
          >
            <Tag className="h-3 w-3" /> {post.category}
          </Link>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} read</span>
          <span>By {post.author}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-5 text-base leading-relaxed text-foreground/90">
          {post.content.map((block: any, i: number) => {
            if (block.type === "h2") return <h2 key={i} className="mt-10 font-display text-2xl font-bold tracking-tight">{block.text}</h2>;
            if (block.type === "h3") return <h3 key={i} className="mt-6 font-display text-xl font-semibold">{block.text}</h3>;
            if (block.type === "ul") return (
              <ul key={i} className="ml-6 list-disc space-y-2 text-muted-foreground">
                {block.items?.map((it: string, j: number) => <li key={j}>{it}</li>)}
              </ul>
            );
            if (block.type === "ol") return (
              <ol key={i} className="ml-6 list-decimal space-y-2 text-muted-foreground">
                {block.items?.map((it: string, j: number) => <li key={j}>{it}</li>)}
              </ol>
            );
            if (block.type === "callout") return (
              <div key={i} className="glass rounded-xl border-l-2 border-accent p-4 text-sm text-muted-foreground">
                {block.text}
              </div>
            );
            if (block.type === "table") return (
              <figure key={i} className="my-6 overflow-x-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  {block.caption && <caption className="px-4 py-2 text-left text-xs text-muted-foreground">{block.caption}</caption>}
                  <thead className="bg-secondary/60">
                    <tr>
                      {block.headers?.map((h: string, j: number) => (
                        <th key={j} scope="col" className="px-3 py-2 text-left font-semibold text-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows?.map((r: string[], j: number) => (
                      <tr key={j} className="border-t border-border">
                        {r.map((c, k) => <td key={k} className="px-3 py-2 text-muted-foreground">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            );
            if (block.type === "faq") return (
              <section key={i} className="mt-10 space-y-4">
                <h2 className="font-display text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
                {block.faqs?.map((f: { q: string; a: string }, j: number) => (
                  <div key={j} className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-foreground">{f.q}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </section>
            );
            if (block.type === "quote") return <blockquote key={i} className="border-l-2 border-accent pl-4 italic text-muted-foreground">{block.text}</blockquote>;
            if (!block.text) return null;
            return <p key={i} className="text-muted-foreground">{block.text}</p>;
          })}
        </div>


        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((t: string) => (
              <span key={t} className="rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold">Related reading</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((r: any) => (
                <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="glass rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-glow">
                  <p className="text-[10px] uppercase tracking-wider text-accent">{r.category}</p>
                  <p className="mt-2 text-sm font-semibold leading-snug">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
