import { HttpResponse, http } from 'msw';
import type { JsonBodyType } from 'msw';

import { scenario } from '@/tests/mocks/scenario';
import { sessionUserId, setActiveSession, writeBrowserSession } from '@/tests/mocks/session';

import { getMockUsers } from '@examples/users-crud/mocks/db';

import { demoAccounts } from './db';

/**
 * Auth reference handlers: a httpOnly-cookie-style session emulated for the
 * mock backend. Sessions resolve to the users-crud seed store, so the
 * signed-in identity matches the directory shown by the users example.
 */

function unauthorized(): HttpResponse<JsonBodyType> {
  return HttpResponse.json(
    { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    { status: 401 },
  );
}

function jsonOk<T extends JsonBodyType>(data: T, extra?: ResponseInit): HttpResponse<T> {
  return HttpResponse.json(data, { status: 200, ...extra });
}

function currentUser(request: Request) {
  const userId = sessionUserId(request);
  if (userId === null) {
    return null;
  }
  return getMockUsers().find((user) => user.id === userId) ?? null;
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    if (scenario.auth.rejectLogin) {
      return unauthorized();
    }
    const body = (await request.json()) as { email?: string; password?: string };
    const account = demoAccounts.find(
      (candidate) => candidate.email === body.email && candidate.password === body.password,
    );
    if (!account) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
        { status: 401 },
      );
    }
    const user = getMockUsers().find((candidate) => candidate.id === account.id);
    if (!user) {
      return unauthorized();
    }
    if (import.meta.env.MODE !== 'test') {
      writeBrowserSession(user.id);
    } else {
      setActiveSession(user.id);
    }
    return jsonOk({ user });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const user = currentUser(request);
    if (user === null) {
      return unauthorized();
    }
    return jsonOk(user);
  }),

  http.post('/api/auth/refresh', ({ request }) => {
    if (scenario.auth.failNextRefresh) {
      scenario.auth.failNextRefresh = false;
      return unauthorized();
    }
    const userId = sessionUserId(request);
    if (userId === null) {
      return unauthorized();
    }
    const user = getMockUsers().find((candidate) => candidate.id === userId);
    if (!user) {
      return unauthorized();
    }
    return jsonOk({ user });
  }),

  http.post('/api/auth/logout', () => {
    setActiveSession(null);
    if (import.meta.env.MODE !== 'test') {
      writeBrowserSession(null);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
