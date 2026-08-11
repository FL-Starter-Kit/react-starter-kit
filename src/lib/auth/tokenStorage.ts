/**
 * Token/session storage strategy.
 *
 * DESIGN DECISION: the application authenticates with httpOnly cookies
 * (the backend sets and reads them). JavaScript never touches tokens —
 * this eliminates XSS token theft, which is why we deliberately do NOT
 * put tokens in localStorage.
 *
 * If your backend uses bearer tokens instead, the correct replacement is
 * an in-memory token store (tokens die on tab close) plus a
 * refresh-token httpOnly cookie — never localStorage. The rest of the
 * auth flow (`refreshSession`, single-flight refresh, retry-on-401) is
 * storage-agnostic.
 */

import { sessionStorageSafe } from '@/lib/storage/safeStorage';
import { isSafeRedirectPath } from '@/utils/url';

const RETURN_PATH_KEY = 'auth.returnPath';
const MOCK_SESSION_KEY = 'auth.mockSession';

/**
 * Where the app should send the user after login. Stored in session
 * storage (not localStorage) and validated against open-redirect attacks.
 */
export function getReturnPath(): string {
  const stored = sessionStorageSafe.get(RETURN_PATH_KEY);
  if (isSafeRedirectPath(stored)) {
    return stored;
  }
  return '/';
}

export function setReturnPath(path: string): void {
  if (isSafeRedirectPath(path)) {
    sessionStorageSafe.set(RETURN_PATH_KEY, path);
  }
}

export function clearReturnPath(): void {
  sessionStorageSafe.remove(RETURN_PATH_KEY);
}

/** Flag used by the dev mock backend to remember the signed-in session. */
export function getMockSession(): string | null {
  return sessionStorageSafe.get(MOCK_SESSION_KEY);
}

export function setMockSession(userId: string): void {
  sessionStorageSafe.set(MOCK_SESSION_KEY, userId);
}

export function clearMockSession(): void {
  sessionStorageSafe.remove(MOCK_SESSION_KEY);
}
