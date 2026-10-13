export async function readAIRequest(request: Request, maxBytes = 65536): Promise<unknown> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > maxBytes) throw new Error('too_large');
  if (!request.body) throw new Error('invalid_json');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  const data: unknown = JSON.parse(new TextDecoder().decode(buffer));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_json');
  return data;
}

export function invalidAIRequest(error: unknown): Response {
  return Response.json({ error: error instanceof Error && error.message === 'too_large' ? 'This request is too large. Please shorten your input.' : 'Please send a valid request.' }, { status: error instanceof Error && error.message === 'too_large' ? 413 : 400 });
}