import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuthFromRequest } from "@/lib/require-auth-http";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "GROQ_API_KEY not configured" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        let body: { messages?: ChatMessage[]; system?: string; model?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "messages required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const safeMessages = messages.slice(-30).map((m) => ({
          role:
            m.role === "assistant"
              ? "assistant"
              : m.role === "system"
                ? "system"
                : "user",
          content: String(m.content ?? "").slice(0, 8000),
        }));

        const systemPrompt =
          typeof body.system === "string" && body.system.trim().length > 0
            ? body.system.slice(0, 4000)
            : "You are Nexoras AI, a friendly, expert study companion for students. Help with study planning, explaining concepts clearly, summarizing notes, exam prep, career advice, and motivation. Use concise markdown formatting with short paragraphs, bullet points, and code blocks when relevant.";

        const payloadMessages = [
          { role: "system" as const, content: systemPrompt },
          ...safeMessages,
        ];

        const model =
          typeof body.model === "string" && body.model.length > 0
            ? body.model
            : "llama-3.3-70b-versatile";

        let upstream: Response;
        try {
          upstream = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "X-Lovable-AIG-SDK": "vercel-ai-sdk",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                messages: payloadMessages,
                stream: true,
              }),
            },
          );
        } catch (err) {
          console.error("[/api/chat] fetch to Lovable AI failed:", err);
          return new Response(
            JSON.stringify({ error: "Failed to reach AI gateway" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }

        if (!upstream.ok || !upstream.body) {
          const errText = await upstream.text().catch(() => "");
          console.error(
            `[/api/chat] gateway error ${upstream.status}:`,
            errText.slice(0, 1000),
          );
          let userMsg = `AI error (${upstream.status})`;
          if (upstream.status === 429)
            userMsg = "Rate limit reached. Please try again in a moment.";
          if (upstream.status === 402)
            userMsg =
              "AI credits exhausted. Add credits in Workspace Settings → Usage.";
          return new Response(
            JSON.stringify({ error: userMsg, details: errText.slice(0, 500) }),
            {
              status: upstream.status,
              headers: { "content-type": "application/json" },
            },
          );
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            let totalChars = 0;
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let idx: number;
                while ((idx = buffer.indexOf("\n")) !== -1) {
                  let line = buffer.slice(0, idx);
                  buffer = buffer.slice(idx + 1);
                  if (line.endsWith("\r")) line = line.slice(0, -1);
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const evt = JSON.parse(data);
                    const delta: string | undefined =
                      evt?.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length > 0) {
                      totalChars += delta.length;
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // ignore non-JSON keepalive lines
                  }
                }
              }
              console.log(`[/api/chat] streamed ${totalChars} chars`);
            } catch (err) {
              console.error("[/api/chat] stream error:", err);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
