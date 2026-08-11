/**
 * AuthProvider — owns the authentication session for the whole app.
 *
 * Responsibilities:
 *  - bootstrap: restore the session by calling /api/auth/me
 *  - login/logout with a single source of truth for `status` and `user`
 *  - expose authorization helpers (can / hasRole) — UI-facing only
 *  - install the 401 → silent refresh pipeline for the HTTP client
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '@/lib/auth/authApi';
import { AuthContext } from '@/lib/auth/context';
import { hasPermission, hasRole } from '@/lib/auth/permissions';
import { installUnauthorizedRefresher } from '@/lib/auth/refreshSession';
import { clearMockSession } from '@/lib/auth/tokenStorage';
import type { AuthState, LoginCredentials, SessionUser } from '@/lib/auth/types';
import { logger } from '@/lib/logging/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);

  const notifySessionRestored = useCallback(() => {
    // Re-fetch the user so the session state is authoritative.
    authApi
      .getCurrentUser()
      .then((sessionUser) => {
        setUser(sessionUser);
        setStatus('authenticated');
      })
      .catch(() => {
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = installUnauthorizedRefresher(notifySessionRestored);

    authApi
      .getCurrentUser()
      .then((sessionUser) => {
        if (!cancelled) {
          setUser(sessionUser);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [notifySessionRestored]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const sessionUser = await authApi.login(credentials);
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Best-effort: still clear the local session if the server is unreachable.
      logger.warn('Logout request failed; clearing local session', {}, error);
    }
    clearMockSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    const sessionUser = await authApi.refresh();
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  const can = useCallback((permission: Parameters<typeof hasPermission>[1]) => hasPermission(user, permission), [user]);

  const value = useMemo<AuthState>(
    () => ({ status, user, login, logout, refreshSession, can, hasRole: (...roles) => hasRole(user, ...roles) }),
    [status, user, login, logout, refreshSession, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
