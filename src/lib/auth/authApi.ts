/**
 * Auth API — the only place that talks to the backend's auth endpoints.
 * Components must not call these directly; use the AuthProvider context.
 */

import { z } from 'zod';

import { httpClient } from '@/lib/http';

import type { LoginCredentials, SessionUser } from './types';

const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

const loginResponseSchema = z.object({
  user: sessionUserSchema,
});

const refreshResponseSchema = z.object({
  user: sessionUserSchema,
});

type LoginResponse = z.infer<typeof loginResponseSchema>;
type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export const authApi = {
  /** Exchange credentials for a session (httpOnly cookie set by the backend). */
  async login(credentials: LoginCredentials): Promise<SessionUser> {
    const data = await httpClient.post<LoginResponse>('/api/auth/login', credentials, {
      skipUnauthorizedHandler: true,
      validate: (raw) => loginResponseSchema.parse(raw),
    });
    return data.user;
  },

  /** Fetch the current session user, or 401 when signed out. */
  async getCurrentUser(): Promise<SessionUser> {
    return httpClient.get<SessionUser>('/api/auth/me', {
      retries: 0,
      validate: (raw) => sessionUserSchema.parse(raw),
    });
  },

  /** Silent session refresh (cookie-based; the browser sends the cookie). */
  async refresh(): Promise<SessionUser> {
    const data = await httpClient.post<RefreshResponse>('/api/auth/refresh', undefined, {
      retries: 0,
      skipUnauthorizedHandler: true,
      validate: (raw) => refreshResponseSchema.parse(raw),
    });
    return data.user;
  },

  /** End the session on the backend (cookie cleared by the server). */
  async logout(): Promise<void> {
    await httpClient.post('/api/auth/logout', undefined, {
      retries: 0,
      skipUnauthorizedHandler: true,
    });
  },
};
