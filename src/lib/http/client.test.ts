import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createHttpClient, setUnauthorizedHandler } from '@/lib/http/client';
import { ApiError, ErrorCode, ResponseContractError } from '@/lib/http/errors';

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('createHttpClient', () => {
  const fetchMock = vi.fn<typeof fetch>();

  function createClient(
    options: Partial<{ defaultRetries: number; defaultTimeoutMs: number; baseUrl: string }> = {},
  ) {
    return createHttpClient({
      baseUrl: options.baseUrl ?? 'https://api.example.com',
      defaultTimeoutMs: options.defaultTimeoutMs ?? 15_000,
      defaultRetries: options.defaultRetries ?? 0,
    });
  }

  afterEach(() => {
    fetchMock.mockReset();
    // The unsubscribe returned by setUnauthorizedHandler clears the handler.
    setUnauthorizedHandler(() => Promise.resolve())();
    vi.stubGlobal('fetch', undefined);
    vi.unstubAllGlobals();
  });

  it('performs a GET and parses JSON', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, { id: 1 })));
    const client = createClient();
    const result = await client.get<{ id: number }>('/api/users');

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.com/api/users');
    expect(init?.method).toBe('GET');
    expect(init?.credentials).toBe('include');
    expect(init?.headers).toMatchObject({ Accept: 'application/json' });
  });

  it('serializes the body as JSON and sets Content-Type for mutations', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(201, { id: 2 })));
    const client = createClient();
    await client.post('/api/users', { name: 'Ada' });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.com/api/users');
    expect(init?.body).toBe(JSON.stringify({ name: 'Ada' }));
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('builds query strings from params, skipping null/undefined/empty', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, [])));
    const client = createClient();
    await client.get('/api/users', {
      params: { page: 2, search: 'ada', empty: '', nil: null, undef: undefined },
    });

    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.com/api/users?page=2&search=ada');
  });

  it('normalizes error envelopes into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      fetchMock.mockResolvedValue(
        jsonResponse(422, {
          code: 'VALIDATION_ERROR',
          message: 'Check the fields',
          fieldErrors: { email: ['is taken'] },
        }),
      ),
    );
    const client = createClient();
    const error = await client.get('/api/users').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.status).toBe(422);
      expect(error.code).toBe(ErrorCode.Validation);
      expect(error.message).toBe('Check the fields');
      expect(error.fieldErrors).toEqual({ email: ['is taken'] });
      expect(error.retryable).toBe(false);
    }
  });

  it('maps status codes when the envelope has no code', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(401, {})));
    const client = createClient();
    const error = await client.get('/api/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Unauthorized);
      expect(error.message).toBe('Your session has expired. Please sign in again.');
    }
  });

  it('treats non-JSON error bodies gracefully', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response('not json', { status: 500 })));
    const client = createClient();
    const error = await client.get('/api/boom').catch((e: unknown) => e);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Server);
      expect(error.retryable).toBe(true);
    }
  });

  it('runs runtime validation on responses and fails loudly on mismatch', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, { id: 'not-a-number' })));
    const client = createClient();
    const schema = z.object({ id: z.number() });
    const error = await client
      .get('/api/user', { validate: (raw) => schema.parse(raw) })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ResponseContractError);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.ResponseInvalid);
      expect(error.status).toBe(200);
      expect(error.message).toBe('Received an unexpected response from the server.');
      expect(error.retryable).toBe(false);
    }
  });

  it('never retries a response contract failure', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, { id: 'not-a-number' })));
    vi.stubGlobal('fetch', fetchMock);
    const client = createClient({ defaultRetries: 2 });
    const schema = z.object({ id: z.number() });
    const error = await client
      .get('/api/user', { validate: (raw) => schema.parse(raw) })
      .catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.ResponseInvalid);
      expect(error.retryable).toBe(false);
    }
  });

  it('returns the validated payload when validation passes', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, { id: 7, name: 'Ada' })));
    const client = createClient();
    const schema = z.object({ id: z.number(), name: z.string() });
    const result = await client.get('/api/user', { validate: (raw) => schema.parse(raw) });
    expect(result).toEqual({ id: 7, name: 'Ada' });
  });

  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(new Response(null, { status: 204 })));
    const client = createClient();
    const result = await client.delete('/api/user/1');
    expect(result).toBeUndefined();
  });

  it('throws ApiError with code Network when fetch rejects', async () => {
    vi.stubGlobal('fetch', fetchMock.mockRejectedValue(new TypeError('Failed to fetch')));
    const client = createClient();
    const error = await client.get('/api/users').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Network);
      expect(error.status).toBe(0);
      expect(error.retryable).toBe(true);
    }
  });

  it('aborts the request when the external signal aborts', async () => {
    vi.stubGlobal('fetch', fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError')));
    const client = createClient();
    const controller = new AbortController();
    controller.abort();

    const error = await client
      .get('/api/users', { signal: controller.signal })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Aborted);
    }
  });

  it('surfaces timeouts as ApiError with code Timeout', async () => {
    vi.stubGlobal(
      'fetch',
      (_input: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const client = createClient({ defaultTimeoutMs: 20 });
    const start = Date.now();
    const error = await client.get('/api/users').catch((e: unknown) => e);
    expect(Date.now() - start).toBeLessThan(2000);

    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Timeout);
      expect(error.status).toBe(0);
      expect(error.retryable).toBe(false);
    }
  });

  it('retries retryable failures up to the retry budget', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createClient({ defaultRetries: 2 });
    const result = await client.get('/api/flaky');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable failures', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(400, {})));
    const client = createClient({ defaultRetries: 2 });
    const error = await client.get('/api/bad').catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.BadRequest);
    }
  });

  it('rejects with the last error once the retry budget is exhausted', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(503, {})));
    const client = createClient({ defaultRetries: 2 });
    const error = await client.get('/api/down').catch((e: unknown) => e);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Server);
    }
  });

  it('honors a delta-seconds Retry-After header instead of the backoff delay', async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(429, {}, { 'Retry-After': '5' }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      vi.stubGlobal('fetch', fetchMock);
      const client = createClient({ defaultRetries: 2 });

      const promise = client.get('/api/throttled');
      await vi.advanceTimersByTimeAsync(4999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      const result = await promise;

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('honors an HTTP-date Retry-After header', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-01-01T00:00:00Z'));
    try {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(503, {}, { 'Retry-After': 'Wed, 01 Jan 2026 00:00:02 GMT' }),
        )
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      vi.stubGlobal('fetch', fetchMock);
      const client = createClient({ defaultRetries: 1 });

      const promise = client.get('/api/maintenance');
      await vi.advanceTimersByTimeAsync(1999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      const result = await promise;

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores malformed Retry-After values (falls back to backoff)', async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(429, {}, { 'Retry-After': 'soon-ish' }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      vi.stubGlobal('fetch', fetchMock);
      const client = createClient({ defaultRetries: 1 });

      const promise = client.get('/api/throttled');
      // Backoff for 429 attempt 1 is 1000ms.
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts the retry backoff when the external signal is cancelled', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(503, {})));
      vi.stubGlobal('fetch', fetchMock);
      const client = createClient({ defaultRetries: 2 });
      const controller = new AbortController();

      const promise = client.get('/api/slow', { signal: controller.signal });
      // Handle the rejection before aborting so the abort is never flagged
      // as an unhandled rejection.
      const resultPromise = promise.then(
        () => undefined,
        (error: unknown) => error,
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      controller.abort();
      await vi.advanceTimersByTimeAsync(10_000);
      const error = await resultPromise;

      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.code).toBe(ErrorCode.Aborted);
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls the unauthorized handler once and retries the request on success', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const handler = vi.fn().mockResolvedValue(undefined);
    setUnauthorizedHandler(handler);
    const client = createClient();
    const result = await client.get('/api/me');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it('rethrows the original 401 when the unauthorized handler fails', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(401, {})));
    const handler = vi.fn().mockRejectedValue(new Error('refresh failed'));
    setUnauthorizedHandler(handler);
    const client = createClient();
    const error = await client.get('/api/me').catch((e: unknown) => e);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    if (error instanceof ApiError) {
      expect(error.code).toBe(ErrorCode.Unauthorized);
      expect(error.status).toBe(401);
    }
  });

  it('does not loop on repeated 401s after a failed refresh', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {}));
    vi.stubGlobal('fetch', fetchMock);
    const handler = vi.fn().mockResolvedValue(undefined);
    setUnauthorizedHandler(handler);
    const client = createClient();

    const error = await client.get('/api/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    // First attempt + one unauthorized retry, then give up.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('setConfig merges config and getConfig returns the merged result', () => {
    const client = createClient({ baseUrl: 'https://a.example.com' });
    client.setConfig({ baseUrl: 'https://b.example.com' });
    expect(client.getConfig()).toMatchObject({
      baseUrl: 'https://b.example.com',
      defaultRetries: 0,
    });
  });

  it('sends a correlation request id header on every request', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, {})));
    const client = createClient();
    await client.get('/api/users');
    const init: RequestInit | undefined = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.['X-Request-Id']).toMatch(/.+/);
  });

  it('merges per-request headers over defaults', async () => {
    vi.stubGlobal('fetch', fetchMock.mockResolvedValue(jsonResponse(200, {})));
    const client = createClient();
    await client.get('/api/users', { headers: { 'X-CSRF': 'abc' } });
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({ Accept: 'application/json', 'X-CSRF': 'abc' });
  });

  it('attaches the CSRF token to state-changing requests only', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(201, {})));
    vi.stubGlobal('fetch', fetchMock);
    const getToken = vi.fn().mockResolvedValue('csrf-token-123');
    const client = createClient();
    client.setConfig({ csrf: { getToken } });

    await client.post('/api/users', { name: 'Ada' });
    const [, postInit] = fetchMock.mock.calls[0] ?? [];
    expect(postInit?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-token-123' });

    await client.get('/api/users');
    const [, getInit] = fetchMock.mock.calls[1] ?? [];
    expect(getInit?.headers).not.toHaveProperty('X-CSRF-Token');
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('honors a custom CSRF header name and skips when no token is returned', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(201, {})));
    vi.stubGlobal('fetch', fetchMock);
    const getToken = vi.fn().mockResolvedValue(null);
    const client = createClient();
    client.setConfig({ csrf: { headerName: 'X-XSRF-TOKEN', getToken } });

    await client.post('/api/users', { name: 'Ada' });
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.headers).not.toHaveProperty('X-XSRF-TOKEN');

    getToken.mockResolvedValue('tok');
    await client.post('/api/users', { name: 'Ada' });
    const [, secondInit] = fetchMock.mock.calls[1] ?? [];
    expect(secondInit?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'tok' });
  });

  it('does not overwrite a per-request CSRF header with the provider token', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(201, {})));
    vi.stubGlobal('fetch', fetchMock);
    const getToken = vi.fn().mockResolvedValue('provider-token');
    const client = createClient();
    client.setConfig({ csrf: { getToken } });

    await client.post(
      '/api/users',
      { name: 'Ada' },
      { headers: { 'X-CSRF-Token': 'explicit-token' } },
    );
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({ 'X-CSRF-Token': 'explicit-token' });
    expect(getToken).not.toHaveBeenCalled();
  });
});
