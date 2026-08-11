/**
 * Single-flight session refresh.
 *
 * When a request returns 401, the HTTP client calls the registered
 * unauthorized handler. This module ensures that when many requests fail
 * simultaneously (e.g. parallel queries after session expiry) the refresh
 * endpoint is hit exactly once and the others await the same promise.
 */

import { setUnauthorizedHandler } from '@/lib/http';
import { logger } from '@/lib/logging/logger';

import { authApi } from './authApi';

type SessionChangeListener = () => void;

let refreshPromise: Promise<boolean> | null = null;
let onSessionRestored: SessionChangeListener | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const user = await authApi.refresh();
    logger.info('Session refreshed', { userId: user.id });
    onSessionRestored?.();
    return true;
  } catch (error) {
    logger.warn('Session refresh failed', {}, error);
    return false;
  }
}

/**
 * Install the 401 → refresh → retry pipeline. `onSessionRestored` lets
 * the AuthProvider mark the session as authenticated again after a
 * silent refresh. Returns an unsubscribe function.
 */
export function installUnauthorizedRefresher(listener: SessionChangeListener): () => void {
  onSessionRestored = listener;
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
