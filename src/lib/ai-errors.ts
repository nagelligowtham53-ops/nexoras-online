export class SafeAIError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function safeAIError(error: unknown): SafeAIError {
  if (error instanceof SafeAIError) return error;
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 502;
  if (status === 400) return new SafeAIError(400, 'Gemini could not process this request. Check your input.');
  if (status === 401 || status === 403) return new SafeAIError(status, 'Gemini access is unavailable. The site owner must check the API key and permissions.');
  if (status === 404) return new SafeAIError(503, 'The configured Gemini model is unavailable. The site owner must update the AI configuration.');
  if (status === 429) return new SafeAIError(429, 'Gemini’s usage quota has been reached. Please wait before trying again.');
  if (status === 402) return new SafeAIError(402, 'Gemini billing needs attention from the site owner.');
  if (error instanceof Error && error.name === 'AbortError') return new SafeAIError(499, 'AI generation was stopped.');
  return new SafeAIError(503, 'Gemini is temporarily busy or unavailable. Please try again later.');
}