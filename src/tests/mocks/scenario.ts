/**
 * Mock backend control surface for tests and development.
 *
 * Core session-lifecycle knobs live here; demo-feature knobs live with their
 * example (see `examples/users-crud/mocks/scenario.ts`). Tests use these to
 * simulate failures, delays and session expiry.
 */

export const scenario = {
  auth: {
    /** Fail the next authenticated request with 401 (tests the refresh flow). */
    expireNextRequest: false,
    /** Fail the next refresh request with 401 (tests the session-expiry transition). */
    failNextRefresh: false,
    /** Reject all login attempts until reset. */
    rejectLogin: false,
  },
};

export function resetScenario(): void {
  scenario.auth.expireNextRequest = false;
  scenario.auth.failNextRefresh = false;
  scenario.auth.rejectLogin = false;
}
