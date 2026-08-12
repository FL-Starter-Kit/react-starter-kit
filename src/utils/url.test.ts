import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { isSafeHref, isSafeRedirectPath, parseQueryParams, readRedirectTarget } from '@/utils/url';

describe('isSafeRedirectPath', () => {
  it('accepts root-relative paths', () => {
    expect(isSafeRedirectPath('/users')).toBe(true);
    expect(isSafeRedirectPath('/')).toBe(true);
  });

  it('rejects null and undefined', () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isSafeRedirectPath('')).toBe(false);
  });

  it('rejects protocol-relative URLs (open redirect)', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false);
    expect(isSafeRedirectPath('///evil.com')).toBe(false);
  });

  it('rejects absolute URLs', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false);
    expect(isSafeRedirectPath('http://evil.com/path')).toBe(false);
  });

  it('rejects backslash tricks', () => {
    expect(isSafeRedirectPath('/\\evil.com')).toBe(false);
  });

  it('rejects non-path targets', () => {
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false);
    expect(isSafeRedirectPath('users')).toBe(false);
  });
});

describe('readRedirectTarget', () => {
  it('extracts a safe path from location state', () => {
    expect(readRedirectTarget({ from: '/users?page=3' })).toBe('/users?page=3');
    expect(readRedirectTarget({ from: '/' })).toBe('/');
  });

  it('returns null for absent or non-object state', () => {
    expect(readRedirectTarget(null)).toBe(null);
    expect(readRedirectTarget(undefined)).toBe(null);
    expect(readRedirectTarget('nope')).toBe(null);
    expect(readRedirectTarget({})).toBe(null);
  });

  it('returns null when from is not a string', () => {
    expect(readRedirectTarget({ from: 42 })).toBe(null);
    expect(readRedirectTarget({ from: ['/users'] })).toBe(null);
  });

  it('rejects unsafe targets (open-redirect guard)', () => {
    expect(readRedirectTarget({ from: 'https://evil.com' })).toBe(null);
    expect(readRedirectTarget({ from: '//evil.com' })).toBe(null);
    expect(readRedirectTarget({ from: 'javascript:alert(1)' })).toBe(null);
  });
});

describe('isSafeHref', () => {
  it('accepts http/https/mailto/tel URLs', () => {
    expect(isSafeHref('https://example.com')).toBe(true);
    expect(isSafeHref('http://example.com')).toBe(true);
    expect(isSafeHref('mailto:hi@example.com')).toBe(true);
    expect(isSafeHref('tel:+15551234567')).toBe(true);
  });

  it('accepts relative and anchor hrefs', () => {
    expect(isSafeHref('/users')).toBe(true);
    expect(isSafeHref('#section')).toBe(true);
    expect(isSafeHref('  /trimmed  ')).toBe(true);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeHref('//evil.com')).toBe(false);
  });

  it('rejects dangerous schemes', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeHref('file:///etc/passwd')).toBe(false);
  });
});

describe('parseQueryParams', () => {
  const schema = z.object({
    page: z.coerce.number().int().positive().catch(1),
    search: z.string().min(1).optional().catch(undefined),
  });

  it('parses valid values into typed output', () => {
    const params = new URLSearchParams('page=3&search=ada');
    expect(parseQueryParams(params, schema)).toEqual({ page: 3, search: 'ada' });
  });

  it('falls back deterministically for invalid values', () => {
    expect(parseQueryParams(new URLSearchParams('page=abc'), schema)).toEqual({
      page: 1,
      search: undefined,
    });
    expect(parseQueryParams(new URLSearchParams('page=-2'), schema)).toEqual({
      page: 1,
      search: undefined,
    });
    expect(parseQueryParams(new URLSearchParams('page=1.5'), schema)).toEqual({
      page: 1,
      search: undefined,
    });
  });

  it('falls back when a key is absent or empty', () => {
    expect(parseQueryParams(new URLSearchParams(''), schema)).toEqual({
      page: 1,
      search: undefined,
    });
    expect(parseQueryParams(new URLSearchParams('search='), schema)).toEqual({
      page: 1,
      search: undefined,
    });
  });
});
