import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ppt-maker")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Free AI PPT Maker for Students & Professionals | Nexoras" },
      { property: "og:description", content: "Create stunning PowerPoint presentations with AI. Free PPT maker for college seminars, projects, business pitches and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Free AI PPT Maker for Students & Professionals | Nexoras" },
      { name: "description", content: "Create stunning PowerPoint presentations with AI. Free PPT maker for college seminars, projects, business pitches and more." },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/presentations" }); },
});
