/**
 * Standardized date/number/currency formatting.
 *
 * TIMEZONE ASSUMPTION: the application renders timestamps in the user's
 * local timezone. All timestamps from the backend are assumed to be UTC
 * (ISO 8601 with a trailing `Z` or explicit offset). If the backend ever
 * returns naive timestamps, they are interpreted as UTC here.
 *
 * Do not format dates/numbers/currency ad hoc in components — use these
 * helpers so the behavior is consistent and testable.
 */

const defaultLocale = 'en-US';

/** Format an ISO timestamp (or Date) for display, e.g. "Aug 10, 2026, 2:30 PM". */
export function formatDateTime(value: string | Date, locale = defaultLocale): string {
  const date = toUtcDate(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Format an ISO timestamp (or Date) as a date only, e.g. "Aug 10, 2026". */
export function formatDate(value: string | Date, locale = defaultLocale): string {
  const date = toUtcDate(value);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

/** Format a number with thousands separators, e.g. "12,345". */
export function formatNumber(value: number, locale = defaultLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Format a currency amount, e.g. "$1,234.56". */
export function formatCurrency(value: number, currency = 'USD', locale = defaultLocale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/** Compact number for large figures, e.g. "1.2M". */
export function formatCompactNumber(value: number, locale = defaultLocale): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

function toUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }
  // Append UTC marker to naive timestamps so they are not misparsed as local.
  const normalized = /(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(normalized);
}
