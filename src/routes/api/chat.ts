import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let body: { messages?: ChatMessage[] };
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

        // Cap message count and length for safety
        const safeMessages = messages.slice(-30).map((m) => ({
          role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
          content: String(m.content ?? "").slice(0, 8000),
        }));

        const input = [
          {
            role: "system" as const,
            content:
              "You are Nexoras AI, a friendly, expert study companion for students. Help with study planning, explaining concepts clearly, summarizing notes, exam prep, career advice, and motivation. Use concise markdown formatting with short paragraphs, bullet points, and code blocks when relevant.",
          },
          ...safeMessages,
        ];

        const upstream = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            input,
            stream: true,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const errText = await upstream.text().catch(() => "");
          return new Response(
            JSON.stringify({
              error: `OpenAI error (${upstream.status})`,
              details: errText.slice(0, 500),
            }),
            { status: upstream.status, headers: { "content-type": "application/json" } },
          );
        }

        // Transform OpenAI Responses SSE -> plain text stream of delta tokens
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
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
                    if (
                      evt.type === "response.output_text.delta" &&
                      typeof evt.delta === "string"
                    ) {
                      controller.enqueue(encoder.encode(evt.delta));
                    }
                  } catch {
                    // ignore non-JSON keepalives
                  }
                }
              }
            } catch (err) {
              console.error("chat stream error:", err);
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
