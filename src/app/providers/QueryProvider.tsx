import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { ApiError } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

/**
 * Central QueryClient configuration:
 *  - retries: network-ish failures retried twice by TanStack Query; the
 *    HTTP client also retries internally, so keep this small.
 *  - refetchOnWindowFocus: off (enterprise default — avoids surprise
 *    network traffic; enable per-query where freshness matters).
 *  - Global error handler: unexpected query errors are logged once,
 *    user-facing surfaces handle rendering.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            return error.retryable && failureCount < 1;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: 0,
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
