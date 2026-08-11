/**
 * Authentication ("who is the user?") and authorization ("what may the
 * user do?") domain types.
 *
 * The UI never decides what a user MAY do on the backend — authorization
 * gates here only control what the UI SHOWS. The backend remains the
 * final authority for every request.
 */

export const Role = {
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];

export const Permission = {
  UsersRead: 'users:read',
  UsersCreate: 'users:create',
  UsersUpdate: 'users:update',
  UsersDelete: 'users:delete',
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

/** The signed-in user as provided by the session endpoint. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Current authentication state exposed to the app via AuthProvider. */
export interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  can: (permission: PermissionValue) => boolean;
  hasRole: (...roles: RoleValue[]) => boolean;
}
