import { describe, expect, it } from 'vitest';

import { hasPermission, hasRole, ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { Permission, Role, type SessionUser } from '@/lib/auth/types';

const admin: SessionUser = { id: '1', name: 'Admin', email: 'admin@example.com', role: Role.Admin };
const editor: SessionUser = {
  id: '2',
  name: 'Editor',
  email: 'editor@example.com',
  role: Role.Editor,
};
const viewer: SessionUser = {
  id: '3',
  name: 'Viewer',
  email: 'viewer@example.com',
  role: Role.Viewer,
};

describe('ROLE_PERMISSIONS', () => {
  it('gives admin every user permission', () => {
    expect(ROLE_PERMISSIONS[Role.Admin]).toContain(Permission.UsersRead);
    expect(ROLE_PERMISSIONS[Role.Admin]).toContain(Permission.UsersCreate);
    expect(ROLE_PERMISSIONS[Role.Admin]).toContain(Permission.UsersUpdate);
    expect(ROLE_PERMISSIONS[Role.Admin]).toContain(Permission.UsersDelete);
  });

  it('gives editor read/create/update but not delete', () => {
    expect(ROLE_PERMISSIONS[Role.Editor]).toContain(Permission.UsersRead);
    expect(ROLE_PERMISSIONS[Role.Editor]).toContain(Permission.UsersCreate);
    expect(ROLE_PERMISSIONS[Role.Editor]).toContain(Permission.UsersUpdate);
    expect(ROLE_PERMISSIONS[Role.Editor]).not.toContain(Permission.UsersDelete);
  });

  it('gives viewer read only', () => {
    expect(ROLE_PERMISSIONS[Role.Viewer]).toEqual([Permission.UsersRead]);
  });
});

describe('hasRole', () => {
  it('returns true when the user has one of the roles', () => {
    expect(hasRole(admin, Role.Admin)).toBe(true);
    expect(hasRole(editor, Role.Admin, Role.Editor)).toBe(true);
  });

  it('returns false when the user has none of the roles', () => {
    expect(hasRole(viewer, Role.Admin, Role.Editor)).toBe(false);
  });

  it('returns false for null users', () => {
    expect(hasRole(null, Role.Admin)).toBe(false);
  });
});

describe('hasPermission', () => {
  it('returns true when the role grants the permission', () => {
    expect(hasPermission(admin, Permission.UsersDelete)).toBe(true);
    expect(hasPermission(editor, Permission.UsersCreate)).toBe(true);
    expect(hasPermission(viewer, Permission.UsersRead)).toBe(true);
  });

  it('returns false when the role lacks the permission', () => {
    expect(hasPermission(editor, Permission.UsersDelete)).toBe(false);
    expect(hasPermission(viewer, Permission.UsersCreate)).toBe(false);
  });

  it('returns false for null users', () => {
    expect(hasPermission(null, Permission.UsersRead)).toBe(false);
  });
});
