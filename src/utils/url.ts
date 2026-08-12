/**
 * URL safety helpers — guards against open redirects and unsafe links.
 */

import type { z } from 'zod';

/** Whether a redirect target is safe to navigate to (same-origin or relative). */
export function isSafeRedirectPath(target: string | null | undefined): target is string {
  if (!target) {
    return false;
  }
  if (!target.startsWith('/') || target.startsWith('//')) {
    return false;
  }
  if (target.includes('://')) {
    return false;
  }
  if (target.startsWith('/\\')) {
    return false;
  }
  return true;
}

/**
 * Extract a validated redirect target from React Router location state
 * (`{ from: string }`). Returns null for anything that is not a safe,
 * same-origin path — guards against open redirects through navigation
 * state.
 */
export function readRedirectTarget(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }
  const from = (state as Record<string, unknown>).from;
  if (typeof from !== 'string') {
    return null;
  }
  return isSafeRedirectPath(from) ? from : null;
}

/** Whether a URL is safe for `href` (http/https/mailto/tel or a relative path). */
export function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return !trimmed.startsWith('//');
  }
  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}

/**
 * Parse URL search params through a Zod schema into typed, validated
 * query state. Search params are always strings, so a schema must be
 * written to handle them deterministically — prefer coercions plus
 * fallbacks (e.g. `z.coerce.number().int().positive().catch(1)`) so
 * invalid or absent values never leak `NaN`/`null` into feature state:
 *
 *   /users?page=abc  →  page: 1
 *
 * Repeated keys collapse to the last occurrence (a single value per key).
 */
export function parseQueryParams<Output>(
  searchParams: URLSearchParams,
  schema: z.ZodType<Output>,
): Output {
  return schema.parse(Object.fromEntries(searchParams.entries()));
}
