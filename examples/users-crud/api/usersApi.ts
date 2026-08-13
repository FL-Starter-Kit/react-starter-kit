/**
 * Users API — typed, runtime-validated calls through the central HTTP
 * client. Features never call `fetch` directly.
 */

import { httpClient } from '@/lib/http';

import type { UserListQuery } from '../models/user';
import {
  userInputSchema,
  userListSchema,
  userSchema,
  type ValidatedUser,
  type ValidatedUserInput,
  type ValidatedUserList,
} from '../schemas/userSchemas';

export const usersApi = {
  /** Paginated, filterable user list. */
  list(query: UserListQuery, signal?: AbortSignal): Promise<ValidatedUserList> {
    return httpClient.get('/api/users', {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        role: query.role,
        status: query.status,
      },
      ...(signal !== undefined ? { signal } : {}),
      validate: (raw) => userListSchema.parse(raw),
    });
  },

  /** Fetch a single user. */
  get(id: string, signal?: AbortSignal): Promise<ValidatedUser> {
    return httpClient.get(`/api/users/${id}`, {
      ...(signal !== undefined ? { signal } : {}),
      validate: (raw) => userSchema.parse(raw),
    });
  },

  /** Create a user. */
  create(input: ValidatedUserInput): Promise<ValidatedUser> {
    return httpClient.post('/api/users', userInputSchema.parse(input), {
      validate: (raw) => userSchema.parse(raw),
    });
  },

  /** Update a user. */
  update(id: string, input: ValidatedUserInput): Promise<ValidatedUser> {
    return httpClient.patch(`/api/users/${id}`, userInputSchema.parse(input), {
      validate: (raw) => userSchema.parse(raw),
    });
  },

  /** Delete a user. */
  remove(id: string): Promise<void> {
    return httpClient.delete(`/api/users/${id}`);
  },
};
