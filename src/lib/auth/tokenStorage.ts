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
 *
 * NOTE: mock-session handling lives in the mock backend
 * (src/tests/mocks/handlers.ts), not here — production auth is storage
 * agnostic and knows nothing about the mock session store.
 */
