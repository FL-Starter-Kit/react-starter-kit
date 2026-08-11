import { useMediaQuery } from '@/hooks/useMediaQuery';

/** True when the user prefers reduced motion. Use to gate animations. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
