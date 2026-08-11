import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

/**
 * Reusable test providers: render UI with an isolated QueryClient and an
 * optional in-memory router, with sensible enterprise defaults
 * (retries disabled, so tests see errors deterministically).
 */

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface RenderWithProvidersOptions {
  queryClient?: QueryClient;
  /** Initial route for the in-memory router. */
  initialEntries?: string[];
}

/**
 * Render `ui` wrapped in QueryClient + an in-memory data router, so
 * components that use routing hooks (`useNavigate`, `useSearchParams`)
 * work in tests. Returns the query client for assertions.
 */
export function renderWithProviders(ui: ReactNode, options: RenderWithProvidersOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();

  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: ui,
      },
    ],
    { initialEntries: options.initialEntries ?? ['/'] },
  );

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...utils, queryClient, router };
}
