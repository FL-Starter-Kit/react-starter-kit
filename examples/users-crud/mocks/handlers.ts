import { HttpResponse, delay, http } from 'msw';
import type { JsonBodyType } from 'msw';

import { sessionUserId } from '@/tests/mocks/session';

import type { User } from '../models/user';

import { getMockUsers, isEmailTaken, resetMockDb, setMockUsers } from './db';
import { resetUsersScenario, usersScenario } from './scenario';

function unauthorized(): HttpResponse<JsonBodyType> {
  return HttpResponse.json(
    { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    { status: 401 },
  );
}

function jsonOk<T extends JsonBodyType>(data: T, extra?: ResponseInit): HttpResponse<T> {
  return HttpResponse.json(data, { status: 200, ...extra });
}

function createApiError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): HttpResponse<JsonBodyType> {
  return HttpResponse.json({ code, message, fieldErrors }, { status });
}

function currentUser(request: Request): User | null {
  const userId = sessionUserId(request);
  if (userId === null) {
    return null;
  }
  return getMockUsers().find((user) => user.id === userId) ?? null;
}

/** Validation shared by create/update. */
function validateUserInput(
  body: unknown,
  excludeId?: string,
):
  | { ok: true; value: { name: string; email: string; role: User['role']; status: User['status'] } }
  | { ok: false; response: HttpResponse<JsonBodyType> } {
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
    if (usersScenario.listDelayMs > 0) {
      await delay(usersScenario.listDelayMs);
    }
    if (usersScenario.failListWith !== undefined) {
      const status = usersScenario.failListWith;
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

/** Reset the example's mock database and scenario knobs between tests. */
export function resetUsersMock(): void {
  resetMockDb();
  resetUsersScenario();
}
