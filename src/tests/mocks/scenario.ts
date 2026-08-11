/**
 * Mock backend control surface for tests and development.
 * Tests use this to simulate failures, delays and session expiry.
 */

export const scenario = {
  auth: {
    /** Fail the next authenticated request with 401 (tests the refresh flow). */
    expireNextRequest: false,
    /** Reject all login attempts until reset. */
    rejectLogin: false,
  },
  users: {
    /**
     * List requests fail with this status until reset (undefined = succeed).
     * Sticky on purpose: the HTTP client retries 5xx, so a one-shot flag
     * would be consumed by the first attempt and never surface an error.
     */
    failListWith: undefined as number | undefined,
    /** Delay applied to list responses, in milliseconds. */
    listDelayMs: 0,
  },
};

export function resetScenario(): void {
  scenario.auth.expireNextRequest = false;
  scenario.auth.rejectLogin = false;
  scenario.users.failListWith = undefined;
  scenario.users.listDelayMs = 0;
}
