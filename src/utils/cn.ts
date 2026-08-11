/**
 * Join class names, filtering out falsy values.
 * A tiny dependency-free alternative to `clsx`.
 */
export function cn(...classes: (string | null | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
