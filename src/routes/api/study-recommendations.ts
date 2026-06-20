import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

export const Route = createFileRoute("/api/study-recommendations")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: {
          exam?: string;
          weak?: { chapter: string; subject: string; accuracy: number }[];
          strong?: { chapter: string; subject: string; accuracy: number }[];
          score?: number;
          total?: number;
        };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const exam = String(body.exam ?? "JEE/NEET").slice(0, 60);
        const weak = (body.weak ?? []).slice(0, 10);
        const strong = (body.strong ?? []).slice(0, 10);
        const score = Number(body.score ?? 0);
        const total = Number(body.total ?? 0);

        const prompt = `A student just finished a ${exam} custom practice test scoring ${score}/${total}.
Weak chapters (low accuracy):
${weak.map((w) => `- ${w.subject} · ${w.chapter} (${Math.round(w.accuracy * 100)}%)`).join("\n") || "- none"}
Strong chapters:
${strong.map((s) => `- ${s.subject} · ${s.chapter} (${Math.round(s.accuracy * 100)}%)`).join("\n") || "- none"}

Return STRICT JSON only:
{
  "summary": "2-3 sentence performance summary",
  "revisionPlan": [ { "day": 1, "focus": "...", "tasks": ["...", "..."] } ],   // 5 days
  "chaptersToRevise": ["chapter 1", "chapter 2", ...],                          // top 5
  "practiceTips": ["...", "...", "..."]                                         // 3-5 actionable tips
}`;

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are an expert JEE/NEET mentor. Output JSON only." },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            }),
          });
        } catch {
          return Response.json({ error: "AI unreachable" }, { status: 502 });
        }
        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("[study-recommendations]", upstream.status, txt.slice(0, 300));
          return Response.json({ error: `AI error (${upstream.status})` }, { status: upstream.status });
        }
        const json = await upstream.json().catch(() => null) as
          | { choices?: Array<{ message?: { content?: string } }> } | null;
        const content = json?.choices?.[0]?.message?.content ?? "";
        let parsed: unknown = {};
        try { parsed = JSON.parse(content); } catch {
          const m = content.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
        }
        return Response.json(parsed);
      },
    },
  },
});
