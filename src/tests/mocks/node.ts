import { setupServer } from 'msw/node';

import { resetScenario } from '@/tests/mocks/scenario';
import { resetSession } from '@/tests/mocks/session';

import { authHandlers } from '@examples/auth/mocks/handlers';
import { usersHandlers, resetUsersMock } from '@examples/users-crud/mocks/handlers';

export const server = setupServer(...authHandlers, ...usersHandlers);

/** Reset mock database, scenario controls and session before each test. */
export function resetMockServer(): void {
  resetScenario();
  resetSession();
  resetUsersMock();
  server.resetHandlers();
}
