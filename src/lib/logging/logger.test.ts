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
});
