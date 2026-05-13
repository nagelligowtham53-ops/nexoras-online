import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { getPost, blogPosts, type BlogPost } from "@/lib/blog-data";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Article — Nexoras" }] };
    return {
      meta: [
        { title: `${post.title} — Nexoras Blog` },
        { name: "description", content: post.description },
        { name: "author", content: post.author },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.category },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.description },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.date,
            articleSection: post.category,
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
});

function Article() {
  const { post } = Route.useLoaderData();
  const related = blogPosts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 3);

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 uppercase tracking-wider text-accent">
            <Tag className="h-3 w-3" /> {post.category}
          </span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} read</span>
          <span>By {post.author}</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-5 text-base leading-relaxed text-foreground/90">
          {post.content.map((block, i) => {
            if (block.type === "h2") return <h2 key={i} className="mt-10 font-display text-2xl font-bold tracking-tight">{block.text}</h2>;
            if (block.type === "h3") return <h3 key={i} className="mt-6 font-display text-xl font-semibold">{block.text}</h3>;
            if (block.type === "ul") return (
              <ul key={i} className="ml-6 list-disc space-y-2 text-muted-foreground">
                {block.items?.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            );
            if (block.type === "quote") return <blockquote key={i} className="border-l-2 border-accent pl-4 italic text-muted-foreground">{block.text}</blockquote>;
            return <p key={i} className="text-muted-foreground">{block.text}</p>;
          })}
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold">Related reading</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
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
