import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

type SubjectChapters = { subject: string; chapters: string[] };

export const Route = createFileRoute("/api/generate-custom-practice")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 500 });

        let body: {
          exam?: string;
          classLevel?: string;
          subjects?: SubjectChapters[];
          count?: number;
          difficulty?: string;
        };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const exam = String(body.exam ?? "JEE Main").slice(0, 60);
        const classLevel = String(body.classLevel ?? "all").slice(0, 20);
        const difficulty = String(body.difficulty ?? "mixed").slice(0, 20);
        const count = Math.max(5, Math.min(100, Number(body.count) || 25));
        const subjects = (Array.isArray(body.subjects) ? body.subjects : [])
          .slice(0, 4)
          .map((s) => ({
            subject: String(s.subject ?? "").slice(0, 40),
            chapters: (Array.isArray(s.chapters) ? s.chapters : [])
              .slice(0, 20)
              .map((c) => String(c).slice(0, 80)),
          }))
          .filter((s) => s.subject && s.chapters.length > 0);

        if (subjects.length === 0) {
          return Response.json({ error: "Select at least one subject and chapter" }, { status: 400 });
        }

        const allowedSubjects = subjects.map((s) => s.subject).join(" | ");
        const chapterLines = subjects
          .map((s) => `  - ${s.subject}: ${s.chapters.join(", ")}`)
          .join("\n");

        const prompt = `Generate ${count} high-quality ${exam} practice questions (class ${classLevel}) at ${difficulty} difficulty.
Subjects and chapters to cover:
${chapterLines}

Distribute questions roughly evenly across the chapters listed.

Return STRICT JSON only, no prose, no markdown fences. Shape:
{ "questions": [ { "subject": "${allowedSubjects}", "chapter": "exact chapter name from list", "type": "mcq", "level": "Easy" | "Medium" | "Hard", "q": "question text (plain text + unicode, no LaTeX)", "options": ["A","B","C","D"], "correct": 0..3, "explanation": "1-3 line solution" } ] }

Rules:
- "subject" MUST be one of: ${allowedSubjects}.
- "chapter" MUST be one of the listed chapters.
- Exactly 4 options per question, no duplicates, under 320 chars each.
- Total questions = ${count}.
- Use ${difficulty === "mixed" ? "a mix of Easy / Medium / Hard" : difficulty} difficulty.`;

        let upstream: Response;
        try {
          upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are an expert Indian competitive-exam (JEE/NEET) question setter. Output JSON only." },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            }),
          });
        } catch (err) {
          console.error("[generate-custom-practice] fetch failed", err);
          return Response.json({ error: "AI unreachable" }, { status: 502 });
        }

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("[generate-custom-practice] gateway", upstream.status, txt.slice(0, 400));
          let msg = `AI error (${upstream.status})`;
          if (upstream.status === 429) msg = "Rate limit. Try again shortly.";
          if (upstream.status === 402) msg = "AI credits exhausted. Add credits in Workspace Settings → Usage.";
          return Response.json({ error: msg }, { status: upstream.status });
        }

        const json = await upstream.json().catch(() => null) as
          | { choices?: Array<{ message?: { content?: string } }> }
          | null;
        const content = json?.choices?.[0]?.message?.content ?? "";
        let parsed: { questions?: unknown[] } = {};
        try { parsed = JSON.parse(content); } catch {
          const m = content.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
        }
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        if (questions.length === 0) {
          return Response.json({ error: "AI returned no questions" }, { status: 502 });
        }
        return Response.json({ questions });
      },
    },
  },
});
