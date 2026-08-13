/**
 * Mock-backend session store, shared by the demo example handlers.
 *
 * The real backend uses httpOnly cookies; MSW's Service Worker cannot touch
 * `Set-Cookie` (a known MSW v2 limitation), so the mock persists the session
 * in localStorage in the browser and in module state under Node (tests set it
 * directly via `setActiveSession()`).
 */

import { scenario } from '@/tests/mocks/scenario';

const SESSION_COOKIE = 'starter_session';

let activeSession: string | null = null;

export function setActiveSession(userId: string | null): void {
  activeSession = userId;
}

export function getActiveSession(): string | null {
  return activeSession;
}

/** Clear the module-state session (browser storage is cleared separately). */
export function resetSession(): void {
  activeSession = null;
}

function readBrowserSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_COOKIE);
  } catch {
    return null;
  }
}

export function writeBrowserSession(userId: string | null): void {
  try {
    if (userId === null) {
      window.localStorage.removeItem(SESSION_COOKIE);
    } else {
      window.localStorage.setItem(SESSION_COOKIE, userId);
    }
  } catch {
    // Storage unavailable (private mode etc.); session simply won't persist.
  }
}

/**
 * The session user id for a request, or null when unauthenticated.
 * Scenario-controlled expiry simulates a dead session so the single-flight
 * refresh flow can be tested through real HTTP requests.
 */
export function sessionUserId(request: Request): string | null {
  if (scenario.auth.expireNextRequest) {
    scenario.auth.expireNextRequest = false;
    return null;
  }
  if (import.meta.env.MODE !== 'test') {
    return readBrowserSession();
  }
  void request;
  return activeSession;
}
