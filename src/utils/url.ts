/**
 * URL safety helpers — guards against open redirects and unsafe links.
 */

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

/** Whether a URL is safe for `href` (http/https/mailto/tel or a relative path). */
export function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return !trimmed.startsWith('//');
  }
  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}
