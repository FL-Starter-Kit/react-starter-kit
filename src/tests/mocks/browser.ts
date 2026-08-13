import { setupWorker } from 'msw/browser';

import { authHandlers } from '@examples/auth/mocks/handlers';
import { usersHandlers } from '@examples/users-crud/mocks/handlers';

export const worker = setupWorker(...authHandlers, ...usersHandlers);
