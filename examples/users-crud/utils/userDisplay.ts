/**
 * Users feature display helpers. Pure functions kept out of components so
 * they are unit testable and reusable. Never put this logic in
 * presentational code.
 */

import {
  UserRole,
  UserStatus,
  type User,
  type UserRoleValue,
  type UserStatusValue,
} from '../models/user';

export const ROLE_LABELS: Readonly<Record<UserRoleValue, string>> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Editor]: 'Editor',
  [UserRole.Viewer]: 'Viewer',
};

export const STATUS_LABELS: Readonly<Record<UserStatusValue, string>> = {
  [UserStatus.Active]: 'Active',
  [UserStatus.Invited]: 'Invited',
  [UserStatus.Disabled]: 'Disabled',
};

export function roleLabel(role: UserRoleValue): string {
  return ROLE_LABELS[role];
}

export function statusLabel(status: UserStatusValue): string {
  return STATUS_LABELS[status];
}

/** Initials for avatar placeholders, e.g. "Ada L". */
export function initials(user: Pick<User, 'name'>): string {
  return user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Whether the current user may delete a target user. */
export function canDelete(target: Pick<User, 'id'>, currentUserId: string | undefined): boolean {
  return currentUserId !== undefined && target.id !== currentUserId;
}
