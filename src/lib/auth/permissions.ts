/**
 * Role → permission mapping. Centralize this in one place.
 * The real source of truth is the backend; this table only mirrors the
 * UI-facing capabilities so components know what to render.
 */

import { Permission, Role, type PermissionValue, type RoleValue, type SessionUser } from './types';

export const ROLE_PERMISSIONS: Readonly<Record<RoleValue, readonly PermissionValue[]>> = {
  [Role.Admin]: [
    Permission.UsersRead,
    Permission.UsersCreate,
    Permission.UsersUpdate,
    Permission.UsersDelete,
  ],
  [Role.Editor]: [Permission.UsersRead, Permission.UsersCreate, Permission.UsersUpdate],
  [Role.Viewer]: [Permission.UsersRead],
};

export function hasRole(user: SessionUser | null, ...roles: RoleValue[]): boolean {
  return user !== null && roles.includes(user.role);
}

export function hasPermission(user: SessionUser | null, permission: PermissionValue): boolean {
  return user !== null && ROLE_PERMISSIONS[user.role].includes(permission);
}
