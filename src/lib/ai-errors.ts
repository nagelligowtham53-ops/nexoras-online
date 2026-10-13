export class SafeAIError extends Error {
  constructor(public status: number, message: string, public retryable = false) { super(message); }
}

/** Sanitized facts extracted from a Google Gen AI error. Never contains keys or prompt text. */
export type GeminiErrorInfo = {
  status: number;
  googleStatus?: string;
  quotaId?: string;
  retryDelayMs?: number;
  dailyQuota: boolean;
};

const TRANSIENT = new Set([429, 500, 502, 503, 504]);
/** Short provider-requested waits are honored; longer ones mean a quota window, not a blip. */
export const MAX_HONORED_RETRY_DELAY_MS = 10_000;

export function errorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const n = Number((error as { status: unknown }).status);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function inspectGeminiError(error: unknown): GeminiErrorInfo {
  const status = errorStatus(error);
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const googleStatus = /\\?"status\\?"\s*:\s*\\?"([A-Z_]+)\\?"/.exec(text)?.[1];
  const quotaId = /quotaId\\?"\s*:\s*\\?"([A-Za-z0-9_\-]+)/.exec(text)?.[1];
  const delay = /retryDelay\\?"\s*:\s*\\?"(\d+(?:\.\d+)?)s/.exec(text)?.[1];
  const retryDelayMs = delay ? Math.round(Number(delay) * 1000) : undefined;
  const dailyQuota = status === 429 && (/PerDay/i.test(quotaId ?? '') || (retryDelayMs !== undefined && retryDelayMs > MAX_HONORED_RETRY_DELAY_MS));
  return { status, googleStatus, quotaId, retryDelayMs, dailyQuota };
}

/** True only for short-lived provider failures worth retrying with backoff. */
export function isTransientGeminiError(error: unknown): boolean {
  if (error instanceof SafeAIError) return false;
  const info = inspectGeminiError(error);
  if (!TRANSIENT.has(info.status)) return false;
  if (info.dailyQuota) return false;
  if (info.retryDelayMs !== undefined && info.retryDelayMs > MAX_HONORED_RETRY_DELAY_MS) return false;
  return true;
}

/** Exponential backoff with full jitter, honoring a short provider retryDelay. */
export function backoffDelayMs(attempt: number, providerDelayMs?: number, random = Math.random): number {
  const base = Math.min(8000, 700 * 2 ** attempt);
  const jittered = base / 2 + random() * (base / 2);
  return Math.max(jittered, Math.min(providerDelayMs ?? 0, MAX_HONORED_RETRY_DELAY_MS));
}

export function safeAIError(error: unknown): SafeAIError {
  if (error instanceof SafeAIError) return error;
  if (error instanceof Error && error.name === 'AbortError') return new SafeAIError(499, 'AI generation was stopped.');
  const info = inspectGeminiError(error);
  switch (info.status) {
    case 400: return new SafeAIError(400, 'Gemini could not process this request. Please rephrase and try again.');
    case 401:
    case 403: return new SafeAIError(info.status, 'AI access is unavailable right now. The site owner has been asked to check the AI configuration.');
    case 402: return new SafeAIError(402, 'AI billing needs attention from the site owner.');
    case 404: return new SafeAIError(503, 'The configured AI model is unavailable. The site owner must update the AI configuration.');
    case 429: return info.dailyQuota
      ? new SafeAIError(429, 'Nexoras AI has reached its daily usage limit. Please try again later today.')
      : new SafeAIError(429, 'Nexoras AI is receiving a lot of requests. Please wait a minute and try again.', true);
    case 500:
    case 502:
    case 503:
    case 504: return new SafeAIError(503, 'Gemini is temporarily busy. Please try again in a moment.', true);
    default: return new SafeAIError(502, 'The AI request could not be completed. Please try again.');
  }
}
