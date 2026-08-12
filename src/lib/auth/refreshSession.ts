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
 *
 * The restored user travels straight from the refresh response into
 * `onSessionRestored` — no follow-up `/me` round trip. Callers can guard
 * against stale restores (e.g. an explicit logout racing the refresh) by
 * pinning a session generation in `onRefreshStart` and discarding the
 * restore when the generation has moved on.
 */

import { setUnauthorizedHandler } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import { authApi } from './authApi';
import type { SessionUser } from './types';

type SessionChangeListener = () => void;
type SessionRestoredListener = (user: SessionUser) => void;

interface SessionListeners {
  /** Called when a NEW single-flight refresh attempt begins (not on re-entry). */
  onRefreshStart?: SessionChangeListener;
  /** Called once when a silent refresh restores the session, with the refreshed user. */
  onSessionRestored: SessionRestoredListener;
  /** Called once when the silent refresh fails — the session is dead. */
  onSessionExpired: SessionChangeListener;
}

let refreshPromise: Promise<boolean> | null = null;
let onRefreshStart: (() => void) | null = null;
let onSessionRestored: SessionRestoredListener | null = null;
let onSessionExpired: SessionChangeListener | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const user = await authApi.refresh();
    logger.info('Session refreshed', { userId: user.id });
    onSessionRestored?.(user);
    return true;
  } catch (error) {
    logger.warn('Session refresh failed', {}, error);
    onSessionExpired?.();
    return false;
  }
}

/**
 * Install the 401 → refresh → retry pipeline. `onRefreshStart` fires once
 * per new refresh attempt (callers can pin a session generation to reject
 * stale restores); `onSessionRestored` delivers the refreshed user;
 * `onSessionExpired` lets the AuthProvider transition to `unauthenticated`
 * when the refresh fails. Success/expiry fire exactly once per attempt
 * (single-flight), no matter how many requests observed the 401. Returns
 * an unsubscribe function.
 */
export function installUnauthorizedRefresher(listeners: SessionListeners): () => void {
  onRefreshStart = listeners.onRefreshStart ?? null;
  onSessionRestored = listeners.onSessionRestored;
  onSessionExpired = listeners.onSessionExpired;
  return setUnauthorizedHandler(async () => {
    if (refreshPromise === null) {
      onRefreshStart?.();
    }
    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (!refreshed) {
      throw new Error('Session refresh failed');
    }
  });
}
