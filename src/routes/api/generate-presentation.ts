import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

export const Route = createFileRoute("/api/generate-presentation")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: {
          topic?: string;
          type?: string;
          audience?: string;
          goal?: string;
          slides?: number;
          theme?: string;
          depth?: string;
          language?: string;
          includeNotes?: boolean;
          includeCharts?: boolean;
          includeReferences?: boolean;
          customPrompt?: string;
        };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const topic = String(body.topic ?? "").slice(0, 200).trim();
        if (!topic) return Response.json({ error: "Topic required" }, { status: 400 });

        const type = String(body.type ?? "College Seminar").slice(0, 60);
        const audience = String(body.audience ?? "College Students").slice(0, 60);
        const goal = String(body.goal ?? "Inform").slice(0, 40);
        const slideCount = Math.max(3, Math.min(40, Number(body.slides) || 10));
        const theme = String(body.theme ?? "Modern").slice(0, 30);
        const depth = String(body.depth ?? "Medium Detail").slice(0, 30);
        const language = String(body.language ?? "English").slice(0, 30);
        const includeNotes = body.includeNotes !== false;
        const includeCharts = body.includeCharts !== false;
        const includeRefs = body.includeReferences !== false;
        const extra = String(body.customPrompt ?? "").slice(0, 500);

        const prompt = `You are an expert presentation designer creating a single presentation.

Topic: "${topic}"
Presentation Type: ${type}
Target Audience: ${audience}
Goal: ${goal}
Number of slides: EXACTLY ${slideCount}
Theme: ${theme}
Content Depth: ${depth}
Language: ${language}
${extra ? `Extra instructions: ${extra}` : ""}

Generate ONE complete presentation about ONLY this topic. Do not combine multiple topics.

Slide structure (adapt to count):
- Slide 1: Title slide (title, subtitle, presenter line)
- Slide 2: Agenda / outline
- Middle slides: Content slides with focused subtopics
${includeCharts ? "- Include 1-2 data/chart slides with realistic numbers" : ""}
${includeRefs ? "- Second-last slide: References / Bibliography" : ""}
- Last slide: Thank You / Q&A

Return STRICT JSON only, no markdown fences. Shape:
{
  "title": "string",
  "subtitle": "string",
  "slides": [
    {
      "layout": "title" | "agenda" | "content" | "two-column" | "bullets" | "quote" | "stats" | "chart" | "references" | "thanks",
      "title": "string",
      "subtitle": "optional string",
      "bullets": ["short bullet", ...]   // 3-6 concise bullets when relevant
      "body": "optional paragraph (2-4 sentences)",
      "stats": [{"label":"...","value":"..."}]  // for stats layout
      "chart": {"type":"bar"|"pie"|"line", "labels":["..."], "data":[1,2,3], "title":"..."} // for chart layout
      "quote": {"text":"...","author":"..."}  // for quote layout
      "references": ["APA citation", ...]  // for references layout
      ${includeNotes ? '"notes": "2-4 sentence speaker notes"' : ""}
    }
  ]
}

Rules:
- EXACTLY ${slideCount} slides total.
- Each slide focused, no fluff. Bullets under 90 chars each.
- Content must be accurate, audience-appropriate (${audience}), and at ${depth} depth.
- Write in ${language}.
- Output JSON only.`;

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a world-class presentation designer. Output strict JSON only." },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            }),
          });
        } catch {
          return Response.json({ error: "AI gateway unreachable" }, { status: 502 });
        }

        if (upstream.status === 429) return Response.json({ error: "Rate limit. Try again shortly." }, { status: 429 });
        if (upstream.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
        if (!upstream.ok) return Response.json({ error: `AI error (${upstream.status})` }, { status: 502 });

        const data = await upstream.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null;
        const content = data?.choices?.[0]?.message?.content ?? "";
        let parsed: unknown;
        try { parsed = JSON.parse(content); } catch {
          return Response.json({ error: "AI returned malformed JSON" }, { status: 502 });
        }

        return Response.json(parsed);
      },
    },
  },
});
