import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { AppErrorBoundary } from '@/app/errors/AppErrorBoundary';
import { RouteErrorScreen } from '@/app/errors/RouteErrorScreen';
import { ProtectedRoute } from '@/app/guards/guards';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RootLayout } from '@/app/layouts/RootLayout';

// The `lazy()` page components are part of a static route table — fast
// refresh does not apply to route configuration, so the rule is disabled.
/* eslint-disable react-refresh/only-export-components */

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const ComponentsPage = lazy(() => import('@/features/docs/pages/ComponentsPage'));
const NotFoundPage = lazy(() => import('@/features/errors/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/features/errors/pages/UnauthorizedPage'));

/**
 * Route table. Conventions:
 *  - pages are lazy-loaded (route-level code splitting)
 *  - every page that needs a session is wrapped in <ProtectedRoute>
 *  - `handle.crumb` feeds the breadcrumbs (see useRouteBreadcrumbs)
 *  - route-level error elements give localized error UI
 */
export const routes: readonly RouteObject[] = [
  {
    path: '/',
    element: (
      <AppErrorBoundary>
        <RootLayout />
      </AppErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
        handle: { crumb: 'Home' },
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorScreen />,
        handle: { crumb: 'Users' },
      },
      {
        path: 'components',
        element: (
          <ProtectedRoute>
            <ComponentsPage />
          </ProtectedRoute>
        ),
        handle: { crumb: 'Components' },
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
        handle: { crumb: 'Access denied' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
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
        element: <LoginPage />,
      },
    ],
  },
];
