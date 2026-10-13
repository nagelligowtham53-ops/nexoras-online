import { describe, expect, it } from 'vitest';
import { safeAIError, SafeAIError, inspectGeminiError, isTransientGeminiError, backoffDelayMs } from '../ai-errors';
import { readAIRequest, invalidAIRequest } from '../ai-request';

describe('safe AI errors', () => {
  it.each([400,401,403,404,429,500,503])('redacts provider details for %i', status => {
    const error = safeAIError({ status, message: 'secret-key student-private-data internal-stack' });
    expect(error.message).not.toContain('secret-key');
    expect(error.message).not.toContain('student-private-data');
    expect(error.message).not.toContain('internal-stack');
  });
  it('retains trusted explicit errors', () => {
    const error = new SafeAIError(422, 'Gemini declined this request.');
    expect(safeAIError(error)).toBe(error);
  });
  it('distinguishes key, quota, model and transient failures', () => {
    expect(safeAIError({status:401}).message).toContain('AI configuration');
    expect(safeAIError({status:429}).message).toContain('wait a minute');
    expect(safeAIError({status:404}).message).toContain('model');
    expect(safeAIError({status:503}).message).toContain('temporarily');
    expect(safeAIError(new Error('weird')).message).not.toContain('busy');
  });
});

const dailyQuota = Object.assign(new Error('{"error":{"message":"{\\n \\"error\\": {\\n \\"code\\": 429, \\"status\\": \\"RESOURCE_EXHAUSTED\\", \\"quotaId\\": \\"GenerateRequestsPerDayPerProjectPerModel-FreeTier\\", \\"retryDelay\\": \\"27518s\\"}}"}}'), { status: 429 });
const minuteLimit = Object.assign(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel","retryDelay":"4s"}]}}'), { status: 429 });

describe('Gemini retry policy', () => {
  it('parses Google quota details without leaking text', () => {
    const info = inspectGeminiError(dailyQuota);
    expect(info).toMatchObject({ status: 429, googleStatus: 'RESOURCE_EXHAUSTED', dailyQuota: true, retryDelayMs: 27518000 });
    expect(safeAIError(dailyQuota).message).toContain('daily usage limit');
  });
  it.each([500, 502, 503, 504])('retries transient %i', status => {
    expect(isTransientGeminiError({ status })).toBe(true);
  });
  it('retries short per-minute 429 but not daily quota', () => {
    expect(isTransientGeminiError(minuteLimit)).toBe(true);
    expect(isTransientGeminiError(dailyQuota)).toBe(false);
  });
  it.each([400, 401, 403, 404, 0])('never retries permanent %i', status => {
    expect(isTransientGeminiError({ status })).toBe(false);
  });
  it('never retries trusted app errors', () => {
    expect(isTransientGeminiError(new SafeAIError(503, 'x'))).toBe(false);
  });
  it('backs off exponentially with jitter and caps', () => {
    expect(backoffDelayMs(0, undefined, () => 0)).toBe(350);
    expect(backoffDelayMs(0, undefined, () => 1)).toBe(700);
    expect(backoffDelayMs(1, undefined, () => 1)).toBe(1400);
    expect(backoffDelayMs(10, undefined, () => 1)).toBe(8000);
    expect(backoffDelayMs(0, 4000, () => 0)).toBe(4000);
    expect(backoffDelayMs(0, 999999, () => 0)).toBe(10000);
  });
});

describe('bounded AI requests', () => {
  it('reads valid JSON objects', async () => {
    expect(await readAIRequest(new Request('http://localhost', { method:'POST',body:JSON.stringify({question:'F = ma'}) }))).toEqual({question:'F = ma'});
  });
  it.each(['null','[]','not JSON'])('rejects malformed input %s', async body => {
    await expect(readAIRequest(new Request('http://localhost', {method:'POST',body}))).rejects.toThrow();
  });
  it('bounds streaming bodies even without content-length', async () => {
    const body = new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('a'.repeat(30)));c.close();}});
    await expect(readAIRequest(new Request('http://localhost',{method:'POST',body,duplex:'half'} as RequestInit),20)).rejects.toThrow('too_large');
    expect(invalidAIRequest(new Error('too_large')).status).toBe(413);
  });
});