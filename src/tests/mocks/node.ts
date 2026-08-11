import { setupServer } from 'msw/node';

import { authHandlers, usersHandlers, resetMocks } from '@/tests/mocks/handlers';

export const server = setupServer(...authHandlers, ...usersHandlers);

/** Reset mock database, scenario controls and session before each test. */
export function resetMockServer(): void {
  resetMocks();
  server.resetHandlers();
}
