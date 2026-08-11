import { describe, expect, it } from 'vitest';

import { formatCompactNumber, formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format';

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(12345)).toBe('12,345');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-1234.5)).toBe('-1,234.5');
  });

  it('honors the locale argument', () => {
    expect(formatNumber(12345, 'de-DE')).toBe('12.345');
  });
});

describe('formatCurrency', () => {
  it('formats currency amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('honors the currency argument', () => {
    expect(formatCurrency(10, 'EUR')).toBe('€10.00');
  });
});

describe('formatCompactNumber', () => {
  it('compacts large numbers', () => {
    expect(formatCompactNumber(1200000)).toBe('1.2M');
    expect(formatCompactNumber(999)).toBe('999');
  });
});

describe('formatDate', () => {
  it('formats an ISO timestamp as a date', () => {
    // 2026-01-01 09:00 UTC
    const date = new Date('2026-01-01T09:00:00Z');
    expect(formatDate('2026-01-01T09:00:00Z')).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date));
  });

  it('appends UTC to naive timestamps', () => {
    const date = new Date('2026-01-01T09:00:00Z');
    expect(formatDate('2026-01-01T09:00:00')).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date));
  });

  it('accepts Date objects', () => {
    const date = new Date('2026-05-05T00:00:00Z');
    expect(formatDate(date)).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date));
  });
});

describe('formatDateTime', () => {
  it('formats an ISO timestamp with time', () => {
    const date = new Date('2026-01-01T09:00:00Z');
    expect(formatDateTime('2026-01-01T09:00:00Z')).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date));
  });

  it('does not misparse timestamps with explicit offsets', () => {
    const date = new Date('2026-01-01T09:00:00+02:00');
    expect(formatDateTime('2026-01-01T09:00:00+02:00')).toBe(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date));
  });
});
