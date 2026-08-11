import { describe, expect, it } from 'vitest';

import { isSafeHref, isSafeRedirectPath } from '@/utils/url';

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
