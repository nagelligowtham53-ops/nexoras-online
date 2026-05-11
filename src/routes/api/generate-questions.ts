import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type SubjectReq = { name: string; count: number };

export const Route = createFileRoute("/api/generate-questions")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI not configured" }, { status: 500 });
        }
        let body: { exam?: string; subjects?: SubjectReq[]; difficulty?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const exam = String(body.exam ?? "JEE Main").slice(0, 60);
        const difficulty = String(body.difficulty ?? "medium").slice(0, 20);
        const subjects = (Array.isArray(body.subjects) ? body.subjects : [])
          .slice(0, 4)
          .map((s) => ({
            name: String(s.name ?? "").slice(0, 40),
            count: Math.max(1, Math.min(80, Number(s.count) || 1)),
          }));
        if (subjects.length === 0) {
          return Response.json({ error: "subjects required" }, { status: 400 });
        }

        const subjectList = subjects
          .map((s) => `${s.count} ${s.name}`)
          .join(", ");

        const prompt = `Generate a complete ${exam} mock test with realistic, exam-quality questions at ${difficulty} difficulty.
Subjects and counts: ${subjectList}.

Return STRICT JSON only, no prose, no markdown fences. Shape:
{ "questions": [ { "subject": "Physics" | "Chemistry" | "Mathematics", "type": "mcq" | "numerical", "q": "question text using plain text and unicode (no LaTeX)", "options": ["A","B","C","D"] (omit for numerical), "correct": 0..3 (for mcq) | numeric_value (for numerical), "explanation": "1-2 line solution" } ] }

Rules:
- Cover diverse chapters across NCERT class 11 & 12 syllabus.
- For numerical type, "correct" must be a number; do not include options.
- For mcq, exactly 4 options, "correct" is the 0-based index.
- No duplicate questions. No images. Keep each question under 280 chars.
- Total questions must equal ${subjects.reduce((a, s) => a + s.count, 0)}.`;

        let upstream: Response;
        try {
          upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Lovable-API-Key": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: "You are an expert Indian competitive-exam question setter. Output JSON only." },
                  { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
              }),
            },
          );
        } catch (err) {
          console.error("[generate-questions] fetch failed", err);
          return Response.json({ error: "AI unreachable" }, { status: 502 });
        }

        if (!upstream.ok) {
          const txt = await upstream.text().catch(() => "");
          console.error("[generate-questions] gateway", upstream.status, txt.slice(0, 400));
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
        try {
          parsed = JSON.parse(content);
        } catch {
          // try to extract JSON substring
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
          }
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
