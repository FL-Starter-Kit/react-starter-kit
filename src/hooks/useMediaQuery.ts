import { useSyncExternalStore } from 'react';

function subscribeToQuery(query: string, onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener('change', onChange);
  return () => {
    mediaQuery.removeEventListener('change', onChange);
  };
}

function getQuerySnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

/** Subscribe to a CSS media query (SSR-safe, no effects). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribeToQuery(query, onChange),
    () => getQuerySnapshot(query),
    () => false,
  );
}
