import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

export const Route = createFileRoute("/api/study-recommendations")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey && !process.env.GEMINI_API_KEY) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: {
          provider?: "groq" | "gemini";
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
        if ((body.weak !== undefined && !Array.isArray(body.weak)) || (body.strong !== undefined && !Array.isArray(body.strong))) return Response.json({ error: "Performance data must contain chapter lists." }, { status: 400 });
        const sanitizeChapters = (chapters: typeof body.weak) => (chapters ?? []).slice(0, 10).filter(c => c && typeof c === "object").map(c => ({ chapter: String(c.chapter ?? "").slice(0, 100), subject: String(c.subject ?? "").slice(0, 60), accuracy: Number.isFinite(Number(c.accuracy)) ? Math.min(1, Math.max(0, Number(c.accuracy))) : 0 }));
        const weak = sanitizeChapters(body.weak);
        const strong = sanitizeChapters(body.strong);
        const score = Number(body.score ?? 0);
        const total = Number(body.total ?? 0);
        if (!Number.isFinite(score) || !Number.isFinite(total) || total < 0) return Response.json({ error: "Test scores must be valid numbers." }, { status: 400 });

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

        if (body.provider !== "groq") {
          const { geminiJson, geminiErrorResponse } = await import("@/lib/gemini.server");
          try {
            const { z } = await import("zod");
            const schema = z.object({ summary: z.string().min(1), revisionPlan: z.array(z.object({ day: z.number().int().min(1).max(5), focus: z.string().min(1), tasks: z.array(z.string().min(1)).min(1) })).length(5), chaptersToRevise: z.array(z.string()), practiceTips: z.array(z.string()).min(3).max(5) });
            const result = schema.safeParse(await geminiJson(auth.userId, { system: "You are an expert study mentor. Return valid JSON only; do not invent results or official syllabus facts.", contents: prompt, signal: request.signal }));
            if (!result.success) return Response.json({ error: "The AI revision plan was incomplete. Nothing was saved or charged." }, { status: 502 });
            return Response.json(result.data);
          } catch (error) { return geminiErrorResponse(error); }
        }

        let upstream: Response;
        try {
          upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
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
