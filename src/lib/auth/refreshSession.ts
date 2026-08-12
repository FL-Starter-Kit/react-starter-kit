/**
 * Single-flight session refresh.
 *
 * When a request returns 401, the HTTP client calls the registered
 * unauthorized handler. This module ensures that when many requests fail
 * simultaneously (e.g. parallel queries after session expiry) the refresh
 * endpoint is hit exactly once and the others await the same promise.
 *
 * The failure path is explicit: when the refresh fails, `onSessionExpired`
 * fires exactly once so the auth subsystem can transition to
 * `unauthenticated` authoritatively — no individual query or component
 * discovers the dead session piecemeal.
 */

import { setUnauthorizedHandler } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import { authApi } from './authApi';

type SessionChangeListener = () => void;

interface SessionListeners {
  /** Called once when a silent refresh restores the session. */
  onSessionRestored: SessionChangeListener;
  /** Called once when the silent refresh fails — the session is dead. */
  onSessionExpired: SessionChangeListener;
}

let refreshPromise: Promise<boolean> | null = null;
let onSessionRestored: SessionChangeListener | null = null;
let onSessionExpired: SessionChangeListener | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const user = await authApi.refresh();
    logger.info('Session refreshed', { userId: user.id });
    onSessionRestored?.();
    return true;
  } catch (error) {
    logger.warn('Session refresh failed', {}, error);
    onSessionExpired?.();
    return false;
  }
}

/**
 * Install the 401 → refresh → retry pipeline. `onSessionRestored` lets
 * the AuthProvider mark the session as authenticated again after a
 * silent refresh; `onSessionExpired` lets it transition to
 * `unauthenticated` when the refresh fails. Both fire exactly once per
 * refresh attempt (single-flight), no matter how many requests observed
 * the 401. Returns an unsubscribe function.
 */
export function installUnauthorizedRefresher(listeners: SessionListeners): () => void {
  onSessionRestored = listeners.onSessionRestored;
  onSessionExpired = listeners.onSessionExpired;
  return setUnauthorizedHandler(async () => {
    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (!refreshed) {
      throw new Error('Session refresh failed');
    }
  });
}
