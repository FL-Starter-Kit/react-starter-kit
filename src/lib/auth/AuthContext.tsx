/**
 * AuthProvider — owns the authentication session for the whole app.
 *
 * Responsibilities:
 *  - bootstrap: restore the session by calling /api/auth/me
 *  - login/logout with a single source of truth for `status` and `user`
 *  - expose authorization helpers (can / hasRole) — UI-facing only
 *  - install the 401 → silent refresh pipeline for the HTTP client
 *
 * Session generation: `generationRef` is bumped on every explicit auth
 * transition (login/logout/expiry). The refresh pipeline pins the current
 * generation when it starts (`onRefreshStart`) and restores only if the
 * generation is unchanged — so a refresh that completes AFTER an explicit
 * logout (or a login) can never resurrect the previous session.
 *
 * NOTE: no mock/session-storage coupling here. The mock backend owns its
 * session lifecycle (see src/tests/mocks/handlers.ts); production backends
 * own theirs via httpOnly cookies.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { authApi } from '@/lib/auth/authApi';
import { AuthContext } from '@/lib/auth/context';
import { hasPermission, hasRole } from '@/lib/auth/permissions';
import { installUnauthorizedRefresher } from '@/lib/auth/refreshSession';
import type { AuthState, LoginCredentials, SessionUser } from '@/lib/auth/types';
import { logger } from '@/lib/logging/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const generationRef = useRef(0);
  const refreshStartGenerationRef = useRef(0);

  /** Called when a new silent-refresh attempt begins. Pins the generation. */
  const noteRefreshStart = useCallback(() => {
    refreshStartGenerationRef.current = generationRef.current;
  }, []);

  /**
   * Silent refresh succeeded — apply the session the refresh endpoint
   * already returned (no extra /me round trip), unless an explicit auth
   * transition happened while the refresh was in flight.
   */
  const notifySessionRestored = useCallback((sessionUser: SessionUser) => {
    if (generationRef.current !== refreshStartGenerationRef.current) {
      // Stale: the session was invalidated (logout) or replaced (login)
      // while the refresh was in flight — the explicit transition wins.
      logger.info('Silent refresh completed after an explicit auth transition; ignoring result');
      return;
    }
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  /** Silent refresh failed — the session is dead. Single authoritative transition. */
  const expireSession = useCallback(() => {
    if (generationRef.current !== refreshStartGenerationRef.current) {
      // Stale failure: a newer auth transition (login/logout) already won
      // this race — never wipe a fresh session with an old failure.
      return;
    }
    generationRef.current += 1;
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = installUnauthorizedRefresher({
      onRefreshStart: noteRefreshStart,
      onSessionRestored: notifySessionRestored,
      onSessionExpired: expireSession,
    });

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
  }, [noteRefreshStart, notifySessionRestored, expireSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const sessionUser = await authApi.login(credentials);
    generationRef.current += 1;
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    // Bump the generation first: a silent refresh that completes while the
    // logout request is in flight must not restore the session.
    generationRef.current += 1;
    try {
      await authApi.logout();
    } catch (error) {
      // Best-effort: still clear the local session if the server is unreachable.
      logger.warn('Logout request failed; clearing local session', {}, error);
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    const sessionUser = await authApi.refresh();
    generationRef.current += 1;
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  const can = useCallback(
    (permission: Parameters<typeof hasPermission>[1]) => hasPermission(user, permission),
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      login,
      logout,
      refreshSession,
      can,
      hasRole: (...roles) => hasRole(user, ...roles),
    }),
    [status, user, login, logout, refreshSession, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
