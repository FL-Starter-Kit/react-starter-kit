import { setupWorker } from 'msw/browser';

import { authHandlers, usersHandlers } from '@/tests/mocks/handlers';

export const worker = setupWorker(...authHandlers, ...usersHandlers);
