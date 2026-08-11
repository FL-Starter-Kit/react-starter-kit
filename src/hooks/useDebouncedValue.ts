import { useEffect, useState } from 'react';

/**
 * Debounce a fast-changing value (e.g. search input) so expensive work
 * (server queries) happens only after the user pauses typing.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => { setDebounced(value); }, delayMs);
    return () => { clearTimeout(handle); };
  }, [value, delayMs]);

  return debounced;
}
