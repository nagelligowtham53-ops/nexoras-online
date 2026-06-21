import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

export const Route = createFileRoute("/api/generate-theme")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: { prompt?: string };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const prompt = String(body.prompt ?? "").slice(0, 400).trim();
        if (!prompt) return Response.json({ error: "Prompt required" }, { status: 400 });

        const sys = `You are a senior presentation art director. Given a short description, output STRICT JSON for a single premium slide theme.

Return ONLY this JSON shape, no markdown:
{
  "name": "string (2-4 words)",
  "bg": "CSS background value (linear-gradient or radial-gradient with 2-4 stops, hex colors)",
  "text": "#hex (main text color, must contrast with bg)",
  "accent": "#hex (vivid accent color for highlights)",
  "vibe": "string (one short phrase)"
}

Rules:
- Use modern, premium palettes (deep navies, royal purples, neon cyans, aurora gradients, glass tones, luxury golds).
- Ensure WCAG-readable contrast between text and the dominant bg color.
- Hex colors only. No rgba(), no oklch().
- One gradient string only (no commas separating multiple background-images).`;

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: sys },
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
        let parsed: { name?: string; bg?: string; text?: string; accent?: string; vibe?: string };
        try { parsed = JSON.parse(content); } catch {
          return Response.json({ error: "AI returned malformed JSON" }, { status: 502 });
        }

        const hex = /^#[0-9a-fA-F]{3,8}$/;
        if (!parsed.bg || !parsed.text || !parsed.accent || !hex.test(parsed.text) || !hex.test(parsed.accent)) {
          return Response.json({ error: "AI returned invalid theme" }, { status: 502 });
        }
        return Response.json({
          id: `AI-${Date.now().toString(36)}`,
          name: String(parsed.name ?? "AI Theme").slice(0, 40),
          category: "Custom",
          bg: String(parsed.bg).slice(0, 500),
          text: parsed.text,
          accent: parsed.accent,
          vibe: String(parsed.vibe ?? "AI generated").slice(0, 80),
        });
      },
    },
  },
});
