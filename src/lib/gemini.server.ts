import { createServerOnlyFn } from '@tanstack/react-start';
import { GoogleGenAI, type Content } from '@google/genai';
import { SafeAIError, safeAIError, inspectGeminiError, isTransientGeminiError, backoffDelayMs } from './ai-errors';

// Explicit server configuration; never silently fall back to another model/provider.
// gemini-3.8-flash was switched off after verified daily free-tier exhaustion (429) and repeated 503 demand spikes.
export const GEMINI_MODEL = 'gemini-3.5-flash';
/** Total attempts per request (1 initial + 2 retries), only before any output is streamed. */
export const GEMINI_MAX_ATTEMPTS = 3;

export const prepareGemini = createServerOnlyFn(async (userId: string) => {
  const key = process.env['GEMINI_API_KEY'];
  if (!key) throw new SafeAIError(503, 'AI is not configured yet. The site owner must add the AI key securely.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.rpc('reserve_ai_request', { p_user_id: userId });
  if (error) throw new SafeAIError(503, 'AI request limits could not be checked. Please try again later.');
  if (!data) throw new SafeAIError(429, 'You have reached your AI request limit. Please try again later.');
  return new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 90000, retryOptions: { attempts: 1 } } });
});

type Input = { system: string; contents: string | Content[]; json?: boolean; signal?: AbortSignal };

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(Object.assign(new Error('aborted'), { name: 'AbortError' })); }, { once: true });
  });
}

async function* generate(ai: GoogleGenAI, input: Input): AsyncGenerator<string> {
  let emitted = false;
  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: input.contents,
        config: { systemInstruction: input.system, responseMimeType: input.json ? 'application/json' : 'text/plain', abortSignal: input.signal },
      });
      let text = '';
      for await (const chunk of stream) {
        if (chunk.promptFeedback?.blockReason || chunk.candidates?.some(c => ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT'].includes(String(c.finishReason)))) {
          throw new SafeAIError(422, 'Gemini declined this request. No credits were charged.');
        }
        const delta = chunk.text ?? '';
        text += delta;
        if (text.length > 250000) throw new SafeAIError(502, 'The AI response was too large. Please request a smaller result.');
        if (delta) { emitted = true; yield delta; }
      }
      if (!text.trim()) throw new SafeAIError(502, 'Gemini returned no usable response. Please try again.');
      return;
    } catch (error) {
      // Sanitized diagnostics only: HTTP status, Google status, quota id, retry delay. Never keys or prompts.
      const info = inspectGeminiError(error);
      const canRetry = !emitted && attempt < GEMINI_MAX_ATTEMPTS - 1 && !input.signal?.aborted && isTransientGeminiError(error);
      console.warn('[gemini] attempt failed', { model: GEMINI_MODEL, attempt: attempt + 1, status: info.status, googleStatus: info.googleStatus, quotaId: info.quotaId, retryDelayMs: info.retryDelayMs, willRetry: canRetry });
      if (canRetry) {
        await sleep(backoffDelayMs(attempt, info.retryDelayMs), input.signal);
        continue;
      }
      throw safeAIError(error);
    }
  }
}

export async function geminiText(userId: string, input: Input): Promise<string> {
  const ai = await prepareGemini(userId);
  let text = '';
  for await (const delta of generate(ai, input)) text += delta;
  return text.trim();
}

export async function geminiJson(userId: string, input: Input): Promise<unknown> {
  const text = await geminiText(userId, { ...input, json: true });
  try { return JSON.parse(text); }
  catch { throw new SafeAIError(502, 'Gemini returned an invalid result. Nothing was saved or charged.'); }
}

export async function geminiChatResponse(userId: string, input: Input): Promise<Response> {
  try {
    const ai = await prepareGemini(userId);
    const iterator = generate(ai, input);
    const first = await iterator.next();
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encoder.encode(first.value));
          for await (const delta of iterator) controller.enqueue(encoder.encode(delta));
          controller.close();
        } catch (error) { controller.error(safeAIError(error)); }
      },
      async cancel() { await iterator.return(undefined); },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-AI-Provider': 'gemini', 'X-AI-Model': GEMINI_MODEL } });
  } catch (error) { return geminiErrorResponse(error); }
}

export function geminiErrorResponse(error: unknown) {
  const safe = safeAIError(error);
  return Response.json({ error: safe.message }, { status: safe.status, headers: { 'Cache-Control': 'no-store' } });
}