import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-presentation")({
  head: () => ({
    meta: [
      { title: "AI Presentation Generator — Create Decks in Seconds | Nexoras" },
      { name: "description", content: "Generate complete AI presentations from a topic, PDF, or document. Edit live and export to PPTX, PDF and Google Slides." },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/presentations" }); },
});
