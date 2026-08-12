import { Outlet } from 'react-router';
import type { RouteObject } from 'react-router';

import { AppErrorBoundary } from '@/app/errors/AppErrorBoundary';
import { RouteErrorScreen } from '@/app/errors/RouteErrorScreen';
import { ProtectedRoute } from '@/app/guards/guards';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RootLayout } from '@/app/layouts/RootLayout';
import { Spinner } from '@/components/ui/Spinner';

/* eslint-disable react-refresh/only-export-components -- the route table mixes
   non-component exports with the HydrateFallback component. */

/** Shown while the router loads the first lazy route chunk. */
export function AppRouteFallback() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ display: 'grid', placeItems: 'center', minHeight: '60dvh' }}
    >
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Route table. Conventions:
 *  - pages are loaded via React Router's route-level `lazy` API (proper
 *    router-integrated code splitting — the router owns the loading
 *    states, so no manual Suspense boundary is needed; the root route's
 *    HydrateFallback covers the initial chunk load)
 *  - every page that needs a session is wrapped in <ProtectedRoute>
 *  - `handle.crumb` feeds the breadcrumbs (see useRouteBreadcrumbs)
 *  - route-level error elements give localized error UI
 */
export const routes: readonly RouteObject[] = [
  {
    path: '/',
    HydrateFallback: AppRouteFallback,
    element: (
      <AppErrorBoundary>
        <RootLayout />
      </AppErrorBoundary>
    ),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/home/pages/HomePage').then((m) => ({ Component: m.default })),
        handle: { crumb: 'Home' },
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorScreen />,
        handle: { crumb: 'Users' },
        children: [
          {
            index: true,
            lazy: () =>
              import('@/features/users/pages/UsersPage').then((m) => ({ Component: m.default })),
          },
        ],
      },
      {
        path: 'components',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        handle: { crumb: 'Components' },
        children: [
          {
            index: true,
            lazy: () =>
              import('@/features/docs/pages/ComponentsPage').then((m) => ({
                Component: m.default,
              })),
          },
        ],
      },
      {
        path: 'unauthorized',
        lazy: () =>
          import('@/features/errors/pages/UnauthorizedPage').then((m) => ({
            Component: m.default,
          })),
        handle: { crumb: 'Access denied' },
      },
      {
        path: '*',
        lazy: () =>
          import('@/features/errors/pages/NotFoundPage').then((m) => ({ Component: m.default })),
        handle: { crumb: 'Not found' },
      },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.default })),
      },
    ],
  },
];
