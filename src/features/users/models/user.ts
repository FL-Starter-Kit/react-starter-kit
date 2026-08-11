/**
 * User domain model — the directory of users managed via the admin UI.
 * (Distinct from the session user in lib/auth, which only carries the
 * signed-in identity.)
 */

export const UserRole = {
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  Active: 'active',
  Invited: 'invited',
  Disabled: 'disabled',
} as const;

export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  status: UserStatusValue;
  /** ISO 8601 UTC timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * List query expressed as URL search params by the page.
 * Optional fields carry `| undefined` so callers can explicitly clear
 * them (exactOptionalPropertyTypes-friendly).
 */
export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string | undefined;
  role?: UserRoleValue | undefined;
  status?: UserStatusValue | undefined;
}

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** Payload for create/update user operations. */
export interface UserInput {
  name: string;
  email: string;
  role: UserRoleValue;
  status: UserStatusValue;
}
