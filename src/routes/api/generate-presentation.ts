import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

type Provider = "lovable" | "openai" | "anthropic" | "gemini";

const FRIENDLY_EXHAUSTED =
  "AI generation is temporarily unavailable. Add your own API key in Presentation Settings to keep creating decks, or try again later.";

export const Route = createFileRoute("/api/generate-presentation")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        let body: {
          topic?: string; type?: string; audience?: string; goal?: string;
          slides?: number; theme?: string; depth?: string; language?: string;
          includeNotes?: boolean; includeCharts?: boolean; includeReferences?: boolean;
          customPrompt?: string;
          provider?: Provider; userApiKey?: string;
        };
        try { body = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const topic = String(body.topic ?? "").slice(0, 200).trim();
        if (!topic) return Response.json({ error: "Topic required" }, { status: 400 });

        const provider: Provider = (["lovable", "openai", "anthropic", "gemini"] as const)
          .includes(body.provider as Provider) ? (body.provider as Provider) : "lovable";
        const userKey = String(body.userApiKey ?? "").trim();

        if (provider === "lovable" && !process.env.LOVABLE_API_KEY) {
          return Response.json({ error: FRIENDLY_EXHAUSTED, friendly: true, code: "no_key" }, { status: 503 });
        }
        if (provider !== "lovable" && !userKey) {
          return Response.json({ error: `Add your ${provider} API key in Presentation Settings.`, friendly: true, code: "missing_user_key" }, { status: 400 });
        }

        const type = String(body.type ?? "College Seminar").slice(0, 60);
        const audience = String(body.audience ?? "College Students").slice(0, 60);
        const goal = String(body.goal ?? "Inform").slice(0, 40);
        const slideCount = Math.max(3, Math.min(40, Number(body.slides) || 10));
        const depth = String(body.depth ?? "Medium Detail").slice(0, 30);
        const language = String(body.language ?? "English").slice(0, 30);
        const includeNotes = body.includeNotes !== false;
        const includeCharts = body.includeCharts !== false;
        const includeRefs = body.includeReferences !== false;
        const extra = String(body.customPrompt ?? "").slice(0, 400);

        // Compact prompt — fewer tokens, same shape contract
        const sys = "You are a world-class presentation designer. Output strict JSON only, no prose, no markdown fences.";
        const layouts = `"title"|"agenda"|"content"|"two-column"|"bullets"|"quote"|"stats"|"chart"|"references"|"thanks"`;
        const user = `Create ONE ${slideCount}-slide deck about "${topic}".
Type: ${type}. Audience: ${audience}. Goal: ${goal}. Depth: ${depth}. Language: ${language}.
${extra ? `Notes: ${extra}\n` : ""}Structure: slide1 title, slide2 agenda, middle=content (mix two-column/bullets/quote/stats${includeCharts ? "/chart" : ""}), ${includeRefs ? "second-last references, " : ""}last thanks.
JSON shape: {"title":string,"subtitle":string,"slides":[{"layout":${layouts},"title":string,"subtitle"?:string,"bullets"?:string[],"body"?:string,"stats"?:[{"label":string,"value":string}],"chart"?:{"type":"bar"|"pie"|"line","labels":string[],"data":number[],"title"?:string},"quote"?:{"text":string,"author"?:string},"references"?:string[]${includeNotes ? `,"notes"?:string` : ""}}]}
Rules: exactly ${slideCount} slides; bullets <90 chars; 3-6 bullets max; concise.`;

        try {
          if (provider === "openai") {
            const r = await callOpenAI(userKey, sys, user);
            return Response.json(r);
          }
          if (provider === "anthropic") {
            const r = await callAnthropic(userKey, sys, user);
            return Response.json(r);
          }
          if (provider === "gemini") {
            const r = await callGemini(userKey, sys, user);
            return Response.json(r);
          }
          // lovable
          const r = await callLovable(process.env.LOVABLE_API_KEY!, sys, user);
          return Response.json(r);
        } catch (e) {
          const err = e as { status?: number; message?: string; friendly?: boolean };
          if (err.status === 402 || err.status === 429) {
            return Response.json(
              { error: FRIENDLY_EXHAUSTED, friendly: true, code: err.status === 402 ? "credits" : "rate_limit" },
              { status: err.status === 402 ? 200 : 429 },
            );
          }
          if (err.status === 401 || err.status === 403) {
            return Response.json({ error: "API key was rejected. Check it in Presentation Settings.", friendly: true, code: "bad_key" }, { status: 401 });
          }
          return Response.json({ error: err.message ?? "AI generation failed", friendly: true }, { status: 502 });
        }
      },
    },
  },
});

// -------------- providers --------------

async function parseJson(content: string): Promise<unknown> {
  // Strip ```json fences if present
  const trimmed = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(trimmed);
}

interface AIError extends Error { status?: number }
function aiError(message: string, status: number): AIError {
  const e = new Error(message) as AIError; e.status = status; return e;
}

async function callLovable(key: string, sys: string, user: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw aiError(`Lovable AI error ${res.status}`, res.status);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return parseJson(data.choices?.[0]?.message?.content ?? "");
}

async function callOpenAI(key: string, sys: string, user: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw aiError(`OpenAI error ${res.status}`, res.status);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return parseJson(data.choices?.[0]?.message?.content ?? "");
}

async function callAnthropic(key: string, sys: string, user: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4000,
      system: sys + " Respond with only a single JSON object, no other text.",
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw aiError(`Anthropic error ${res.status}`, res.status);
  const data = await res.json() as { content?: Array<{ text?: string }> };
  return parseJson(data.content?.[0]?.text ?? "");
}

async function callGemini(key: string, sys: string, user: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
      }),
    },
  );
  if (!res.ok) throw aiError(`Gemini error ${res.status}`, res.status);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join("") ?? "";
  return parseJson(text);
}
