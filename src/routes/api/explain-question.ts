import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

export const Route = createFileRoute("/api/explain-question")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: {
          question?: string;
          options?: string[];
          correctAnswer?: string;
          subject?: string;
          chapter?: string;
          userAnswer?: string;
          mode?: "explain" | "hint" | "alt-method" | "mistake";
        };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const question = String(body.question ?? "").slice(0, 2000);
        if (!question) return Response.json({ error: "Question required" }, { status: 400 });
        const options = (Array.isArray(body.options) ? body.options : []).slice(0, 6).map((o) => String(o).slice(0, 400));
        const correct = String(body.correctAnswer ?? "").slice(0, 400);
        const subject = String(body.subject ?? "").slice(0, 40);
        const chapter = String(body.chapter ?? "").slice(0, 100);
        const userAnswer = String(body.userAnswer ?? "").slice(0, 400);
        const mode = body.mode ?? "explain";

        const modeInstruction = {
          explain: "Give a clear step-by-step solution (numbered steps), followed by the underlying concept and one NCERT reference (chapter/topic).",
          hint: "Give ONE short hint that nudges the student toward the correct approach without revealing the answer.",
          "alt-method": "Give an alternative shorter/smarter method to solve this. Contrast with the standard approach in 1 line.",
          mistake: "Explain the common mistakes students make on this question and how to avoid them.",
        }[mode];

        const prompt = `Subject: ${subject} | Chapter: ${chapter}
Question: ${question}
${options.length ? `Options:\n${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}` : ""}
${correct ? `Correct answer: ${correct}` : ""}
${userAnswer ? `Student's answer: ${userAnswer}` : ""}

Task: ${modeInstruction}
Keep it under 220 words. Use plain text with unicode maths (no LaTeX, no markdown fences).`;

        let upstream: Response;
        try {
          upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are an expert JEE/NEET tutor. Give crisp, accurate, pedagogically sound explanations. Never fabricate NCERT references." },
                { role: "user", content: prompt },
              ],
            }),
          });
        } catch (err) {
          console.error("[explain-question] fetch failed", err);
          return Response.json({ error: "AI unreachable" }, { status: 502 });
        }

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("[explain-question] gateway", upstream.status, txt.slice(0, 400));
          let msg = `AI error (${upstream.status})`;
          if (upstream.status === 429) msg = "AI rate-limited. Try again shortly.";
          if (upstream.status === 402) msg = "AI credits exhausted.";
          return Response.json({ error: msg }, { status: upstream.status });
        }

        const json = await upstream.json().catch(() => null) as
          | { choices?: Array<{ message?: { content?: string } }> }
          | null;
        const content = json?.choices?.[0]?.message?.content ?? "";
        return Response.json({ text: content.trim() });
      },
    },
  },
});
