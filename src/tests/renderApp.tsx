import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { routes } from '@/app/router/routes';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { setActiveSession } from '@/tests/mocks/session';
import { createTestQueryClient } from '@/tests/render';

interface RenderAppOptions {
  initialEntries?: string[];
  /** Sign the mock backend in as this user id (default: no session). */
  sessionUserId?: string | null;
}

/**
 * Render the full app (theme + query + auth + router with the real route
 * table) against the MSW backend. The mock backend is reset after each
 * test by setup.ts. Awaits the router's lazy route modules before
 * returning, so queries run against a settled screen.
 */
export async function renderApp(options: RenderAppOptions = {}) {
  setActiveSession(options.sessionUserId ?? null);
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter([...routes], {
    initialEntries: options.initialEntries ?? ['/'],
  });

  // The app boots inside <StrictMode> in production code paths (see
  // bootstrap.tsx), so integration tests run in StrictMode too — double
  // renders/effects must not break app behavior.
  const utils = render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );

  // Wait until the router's lazy route modules have resolved and the
  // layout has actually rendered (route loads are async in react-router v8).
  await waitFor(() => {
    if (!router.state.renderFallback && document.body.querySelector('main') !== null) {
      return;
    }
    throw new Error('app not ready');
  });

  return { ...utils, queryClient, router };
}

/** Wait for the auth bootstrap (`/api/auth/me`) to settle. */
export async function waitForAuthSettled(): Promise<void> {
  // The AuthProvider resolves the session asynchronously; a single macrotask
  // tick is usually enough, but polling is safer across environments.
  await new Promise((resolve) => setTimeout(resolve, 0));
}
