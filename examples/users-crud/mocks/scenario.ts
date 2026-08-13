/**
 * Test knobs for the users-crud example's mock backend. The auth/session
 * knobs live in src/tests/mocks/scenario.ts (core); these belong to the
 * example because they exercise the example's list endpoint.
 */

export const usersScenario = {
  /**
   * List requests fail with this status until reset (undefined = succeed).
   * Sticky on purpose: the HTTP client retries 5xx, so a one-shot flag
   * would be consumed by the first attempt and never surface an error.
   */
  failListWith: undefined as number | undefined,
  /** Delay applied to list responses, in milliseconds. */
  listDelayMs: 0,
};

export function resetUsersScenario(): void {
  usersScenario.failListWith = undefined;
  usersScenario.listDelayMs = 0;
}
