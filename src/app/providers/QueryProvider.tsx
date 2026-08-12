import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { logger } from '@/lib/logging/logger';

/**
 * Central QueryClient configuration:
 *  - retries: OFF here — the HTTP client owns retries (exponential backoff,
 *    Retry-After honoring, cancellation-aware sleeps). TanStack Query never
 *    retries so attempts are never multiplied across two owners.
 *  - refetchOnWindowFocus: off (enterprise default — avoids surprise
 *    network traffic; enable per-query where freshness matters).
 *  - Global error handler: unexpected query errors are logged once,
 *    user-facing surfaces handle rendering.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        logger.error('Unhandled query error', {}, error);
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
