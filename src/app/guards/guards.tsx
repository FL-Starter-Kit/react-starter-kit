/**
 * Authorization UI primitives.
 *
 * IMPORTANT: these only control what the UI renders. The backend is the
 * final authority — every API request is authorized server-side.
 *
 * - ProtectedRoute: requires an authenticated session, otherwise redirects
 *   to /login (remembering the attempted URL).
 * - PermissionGate: renders children only when the user has a permission;
 *   `fallback` may be provided (e.g. a "not authorized" message).
 * - RoleGate: renders children only when the user has one of the roles.
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { Spinner } from '@/components/ui/Spinner';
import { useAuthContext } from '@/lib/auth/context';
import { setReturnPath } from '@/lib/auth/tokenStorage';
import type { PermissionValue, RoleValue } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** Full-screen loading state used while the session is being restored. */
export function SessionLoader() {
  return (
    <div role="status" aria-label="Loading your session" style={{ display: 'grid', placeItems: 'center', minHeight: '60dvh' }}>
      <Spinner size="lg" />
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuthContext();
  const location = useLocation();

  if (status === 'loading') {
    return <SessionLoader />;
  }

  if (status === 'unauthenticated') {
    setReturnPath(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return children;
}

interface PermissionGateProps {
  permission: PermissionValue;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = useAuthContext();
  return can(permission) ? children : fallback;
}

interface RoleGateProps {
  roles: readonly RoleValue[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuthContext();
  return hasRole(...roles) ? children : fallback;
}
