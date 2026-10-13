import { describe, expect, it } from 'vitest';
import { safeAIError, SafeAIError } from '../ai-errors';
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
    expect(safeAIError({status:401}).message).toContain('API key');
    expect(safeAIError({status:429}).message).toContain('quota');
    expect(safeAIError({status:404}).message).toContain('model');
    expect(safeAIError({status:503}).message).toContain('temporarily');
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