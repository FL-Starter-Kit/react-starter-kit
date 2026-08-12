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

const MOCK_SESSION_KEY = 'auth.mockSession';

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
