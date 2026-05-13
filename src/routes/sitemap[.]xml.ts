import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { blogPosts } from "@/lib/blog-data";

const BASE_URL = "https://nexoras.online";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/blog", changefreq: "weekly", priority: "0.9" },
          { path: "/tools", changefreq: "monthly", priority: "0.8" },
          { path: "/calculators", changefreq: "monthly", priority: "0.8" },
          { path: "/resume", changefreq: "monthly", priority: "0.8" },
          { path: "/career", changefreq: "monthly", priority: "0.7" },
          { path: "/mock-tests", changefreq: "weekly", priority: "0.8" },
          { path: "/mock-interview", changefreq: "weekly", priority: "0.8" },
          { path: "/practice", changefreq: "weekly", priority: "0.7" },
          { path: "/roadmaps", changefreq: "monthly", priority: "0.7" },
          { path: "/crack-jee", changefreq: "monthly", priority: "0.7" },
          { path: "/competitive-exams", changefreq: "monthly", priority: "0.7" },
          { path: "/engineering-roadmaps", changefreq: "monthly", priority: "0.7" },
          { path: "/future-careers", changefreq: "monthly", priority: "0.7" },
          { path: "/courses", changefreq: "monthly", priority: "0.7" },
          { path: "/pricing", changefreq: "monthly", priority: "0.6" },
          { path: "/privacy", changefreq: "yearly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.4" },
          { path: "/login", changefreq: "yearly", priority: "0.3" },
          { path: "/signup", changefreq: "yearly", priority: "0.3" },
        ];

        const blogEntries: SitemapEntry[] = blogPosts.map((p) => ({
          path: `/blog/${p.slug}`,
          lastmod: p.date,
          changefreq: "monthly",
          priority: "0.8",
        }));

        const entries = [...staticEntries, ...blogEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
