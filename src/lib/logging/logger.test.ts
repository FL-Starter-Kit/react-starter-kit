import { describe, expect, it } from 'vitest';

import { sanitize } from '@/lib/logging/logger';

describe('sanitize', () => {
  it('leaves primitives untouched', () => {
    const missing: unknown = undefined;
    expect(sanitize('hello')).toBe('hello');
    expect(sanitize(42)).toBe(42);
    expect(sanitize(true)).toBe(true);
    expect(sanitize(null)).toBeNull();
    expect(sanitize(missing)).toBeUndefined();
  });

  it('redacts sensitive top-level keys case-insensitively', () => {
    const result = sanitize({
      password: 'hunter2',
      accessToken: 'abc',
      refreshToken: 'def',
      Authorization: 'Bearer x',
      Cookie: 'sid=1',
      secret: 's3cret',
      token: 't',
      name: 'Ada',
    });
    expect(result).toEqual({
      password: '[REDACTED]',
      accessToken: '[REDACTED]',
      refreshToken: '[REDACTED]',
      Authorization: '[REDACTED]',
      Cookie: '[REDACTED]',
      secret: '[REDACTED]',
      token: '[REDACTED]',
      name: 'Ada',
    });
  });

  it('redacts sensitive keys nested inside objects', () => {
    const result = sanitize({ user: { email: 'ada@example.com', password: 'hunter2' } });
    expect(result).toEqual({ user: { email: 'ada@example.com', password: '[REDACTED]' } });
  });

  it('recurses into arrays', () => {
    const result = sanitize([{ password: 'x', id: 1 }, 'plain']);
    expect(result).toEqual([{ password: '[REDACTED]', id: 1 }, 'plain']);
  });

  it('does not mutate the input', () => {
    const input = { password: 'hunter2', nested: { token: 'abc' } };
    const result = sanitize(input);
    expect(input.password).toBe('hunter2');
    expect(input.nested?.token).toBe('abc');
    expect(result.password).toBe('[REDACTED]');
  });

  it('redacts keys matching by lowercase comparison', () => {
    const result = sanitize({ PASSWORD: 'x', Token: 'y' });
    expect(result).toEqual({ PASSWORD: '[REDACTED]', Token: '[REDACTED]' });
  });

  it('redacts headers-style credential keys', () => {
    const result = sanitize({
      headers: {
        Authorization: 'Bearer abc123',
        Cookie: 'sid=1',
        'Set-Cookie': 'refresh_token=xyz',
        'X-CSRF-Token': 'csrf-42',
      },
      Cookies: 'session=abc',
    });
    expect(result).toEqual({
      headers: {
        Authorization: '[REDACTED]',
        Cookie: '[REDACTED]',
        'Set-Cookie': '[REDACTED]',
        'X-CSRF-Token': '[REDACTED]',
      },
      Cookies: '[REDACTED]',
    });
  });

  it('redacts snake-cased and dashed token keys', () => {
    const result = sanitize({
      access_token: 'a',
      refresh_token: 'r',
      csrf: 'c',
      csrf_token: 'c2',
      set_cookie: 'x',
      ok_field: 'keep',
    });
    expect(result).toEqual({
      access_token: '[REDACTED]',
      refresh_token: '[REDACTED]',
      csrf: '[REDACTED]',
      csrf_token: '[REDACTED]',
      set_cookie: '[REDACTED]',
      ok_field: 'keep',
    });
  });

  it('redacts credential keys inside nested headers objects', () => {
    const result = sanitize({
      meta: { nested: { headers: { Authorization: 'Bearer z', id: 1 } } },
    });
    expect(result).toEqual({
      meta: { nested: { headers: { Authorization: '[REDACTED]', id: 1 } } },
    });
  });
});
