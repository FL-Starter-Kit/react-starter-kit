import { HttpResponse, delay, http } from 'msw';
import type { JsonBodyType } from 'msw';

import type { User } from '@/features/users/models/user';
import { demoAccounts, getMockUsers, isEmailTaken, resetMockDb, setMockUsers } from '@/tests/mocks/db';
import { resetScenario, scenario } from '@/tests/mocks/scenario';

const SESSION_COOKIE = 'starter_session';

/**
 * Session resolution:
 *  - Browser (dev/e2e): the real backend sets an httpOnly cookie, but MSW's
 *    Service Worker cannot touch `Set-Cookie` (a known MSW v2 limitation), so
 *    the mock persists the session in localStorage instead. Each e2e test
 *    gets a fresh browser context, so sessions never leak between tests.
 *  - Node tests: tests set the active session directly via
 *    `setActiveSession()`. MSW's node server emulates cookies across
 *    requests, so in test mode the storage path is disabled to prevent
 *    a session set by one test from leaking into the next.
 */

let activeSession: string | null = null;

export function setActiveSession(userId: string | null): void {
  activeSession = userId;
}

export function getActiveSession(): string | null {
  return activeSession;
}

function readBrowserSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_COOKIE);
  } catch {
    return null;
  }
}

function writeBrowserSession(userId: string | null): void {
  try {
    if (userId === null) {
      window.localStorage.removeItem(SESSION_COOKIE);
    } else {
      window.localStorage.setItem(SESSION_COOKIE, userId);
    }
  } catch {
    // Storage unavailable (private mode etc.); session simply won't persist.
  }
}

function sessionUserId(request: Request): string | null {
  if (scenario.auth.expireNextRequest) {
    scenario.auth.expireNextRequest = false;
    return null;
  }
  if (import.meta.env.MODE !== 'test') {
    return readBrowserSession();
  }
  void request;
  return activeSession;
}

function currentUser(request: Request): User | null {
  const userId = sessionUserId(request);
  if (userId === null) {
    return null;
  }
  return getMockUsers().find((user) => user.id === userId) ?? null;
}

function unauthorized(): HttpResponse<JsonBodyType> {
  return HttpResponse.json(
    { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    { status: 401 },
  );
}

function jsonOk<T extends JsonBodyType>(data: T, extra?: ResponseInit): HttpResponse<T> {
  return HttpResponse.json(data, { status: 200, ...extra });
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    if (scenario.auth.rejectLogin) {
      return unauthorized();
    }
    const body = (await request.json()) as { email?: string; password?: string };
    const account = Object.values(demoAccounts).find(
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
      activeSession = user.id;
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
    activeSession = null;
    if (import.meta.env.MODE !== 'test') {
      writeBrowserSession(null);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

function createApiError(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>): HttpResponse<JsonBodyType> {
  return HttpResponse.json({ code, message, fieldErrors }, { status });
}

/** Validation shared by create/update. */
function validateUserInput(
  body: unknown,
  excludeId?: string,
): { ok: true; value: { name: string; email: string; role: User['role']; status: User['status'] } } | { ok: false; response: HttpResponse<JsonBodyType> } {
  const { name, email, role, status } = (body ?? {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string[]> = {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    fieldErrors.name = ['Name must be at least 2 characters.'];
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ['Enter a valid email address.'];
  } else if (isEmailTaken(email.trim().toLowerCase(), excludeId)) {
    fieldErrors.email = ['A user with this email already exists.'];
  }
  if (role !== 'admin' && role !== 'editor' && role !== 'viewer') {
    fieldErrors.role = ['Select a valid role.'];
  }
  if (status !== 'active' && status !== 'invited' && status !== 'disabled') {
    fieldErrors.status = ['Select a valid status.'];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      response: createApiError(
        422,
        'VALIDATION_ERROR',
        'Please correct the highlighted fields.',
        fieldErrors,
      ),
    };
  }
  return {
    ok: true,
    value: {
      name: name as string,
      email: (email as string).trim().toLowerCase(),
      role: role as User['role'],
      status: status as User['status'],
    },
  };
}

export const usersHandlers = [
  http.get('/api/users', async ({ request }) => {
    if (scenario.users.listDelayMs > 0) {
      await delay(scenario.users.listDelayMs);
    }
    if (scenario.users.failListWith !== undefined) {
      const status = scenario.users.failListWith;
      if (status === 500) {
        return createApiError(500, 'SERVER_ERROR', 'The server encountered an error.');
      }
      return createApiError(status, 'UNAUTHORIZED', 'Authentication required.');
    }

    const user = currentUser(request);
    if (!user) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 10));
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? '';
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');

    const filtered = getMockUsers().filter((candidate) => {
      if (search.length > 0) {
        const haystack = `${candidate.name} ${candidate.email}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      if (role !== null && role !== '' && candidate.role !== role) {
        return false;
      }
      if (status !== null && status !== '' && candidate.status !== status) {
        return false;
      }
      return true;
    });

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return jsonOk({
      items,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    });
  }),

  http.get('/api/users/:id', ({ params, request }) => {
    const user = currentUser(request);
    if (!user) {
      return unauthorized();
    }
    const found = getMockUsers().find((candidate) => candidate.id === params.id);
    if (!found) {
      return createApiError(404, 'NOT_FOUND', 'User not found.');
    }
    return jsonOk(found);
  }),

  http.post('/api/users', async ({ request }) => {
    const user = currentUser(request);
    if (!user) {
      return unauthorized();
    }
    const body = await request.json();
    const validation = validateUserInput(body);
    if (!validation.ok) {
      return validation.response;
    }
    const created: User = {
      id: `user-${crypto.randomUUID()}`,
      ...validation.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMockUsers([...getMockUsers(), created]);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('/api/users/:id', async ({ params, request }) => {
    const user = currentUser(request);
    if (!user) {
      return unauthorized();
    }
    const id = String(params.id);
    const found = getMockUsers().find((candidate) => candidate.id === id);
    if (!found) {
      return createApiError(404, 'NOT_FOUND', 'User not found.');
    }
    const body = await request.json();
    const validation = validateUserInput(body, id);
    if (!validation.ok) {
      return validation.response;
    }
    const updated: User = {
      ...found,
      ...validation.value,
      updatedAt: new Date().toISOString(),
    };
    setMockUsers(getMockUsers().map((candidate) => (candidate.id === id ? updated : candidate)));
    return jsonOk(updated);
  }),

  http.delete('/api/users/:id', ({ params, request }) => {
    const user = currentUser(request);
    if (!user) {
      return unauthorized();
    }
    const id = String(params.id);
    if (id === user.id) {
      return createApiError(403, 'FORBIDDEN', 'You cannot delete your own account.');
    }
    const found = getMockUsers().find((candidate) => candidate.id === id);
    if (!found) {
      return createApiError(404, 'NOT_FOUND', 'User not found.');
    }
    setMockUsers(getMockUsers().filter((candidate) => candidate.id !== id));
    return new HttpResponse(null, { status: 204 });
  }),
];

export function resetMocks(): void {
  resetMockDb();
  resetScenario();
  setActiveSession(null);
}
