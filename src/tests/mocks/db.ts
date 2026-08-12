/**
 * In-memory mock database shared by the MSW handlers.
 * Reset between tests via `resetMockDb()`.
 */

import { UserRole, UserStatus, type User } from '@/features/users/models/user';

const NAMES = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Edsger Dijkstra',
  'Margaret Hamilton',
  'Tim Berners-Lee',
  'Barbara Liskov',
  'Linus Torvalds',
  'Radia Perlman',
  'Guido van Rossum',
  'Katherine Johnson',
  'James Gosling',
  'Dorothy Vaughan',
  'Bjarne Stroustrup',
  'Mary Jackson',
  'Dennis Ritchie',
  'Frances Allen',
  'Ken Thompson',
  'Brendan Eich',
  'Donald Knuth',
  'Mary Wilkes',
  'Anders Hejlsberg',
  'Joan Clarke',
  'Niklaus Wirth',
  'Sophie Wilson',
];

const ROLES: readonly User['role'][] = [
  UserRole.Admin,
  UserRole.Editor,
  UserRole.Viewer,
  UserRole.Viewer,
  UserRole.Editor,
];
const STATUSES: readonly User['status'][] = [
  UserStatus.Active,
  UserStatus.Active,
  UserStatus.Active,
  UserStatus.Invited,
  UserStatus.Disabled,
];

function createSeedUsers(): User[] {
  return NAMES.map((name, index) => {
    const id = `user-${index + 1}`;
    return {
      id,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@example.com`,
      role: ROLES[index % ROLES.length] ?? UserRole.Viewer,
      status: STATUSES[index % STATUSES.length] ?? UserStatus.Active,
      createdAt: new Date(Date.UTC(2026, 0, index + 1, 9, 0, 0)).toISOString(),
      updatedAt: new Date(Date.UTC(2026, 0, index + 1, 12, 0, 0)).toISOString(),
    };
  });
}

let users: User[] = createSeedUsers();

/**
 * Demo accounts for the login form. Ids must exist in the seed list —
 * the login/me handlers resolve the session to a seed user — and roles
 * must match that seed user's role (Admin/Editor/Viewer cycle).
 */
export const demoAccounts = {
  admin: { id: 'user-1', email: 'admin@example.com', password: 'admin123', role: UserRole.Admin },
  editor: {
    id: 'user-2',
    email: 'editor@example.com',
    password: 'editor123',
    role: UserRole.Editor,
  },
  viewer: {
    id: 'user-3',
    email: 'viewer@example.com',
    password: 'viewer123',
    role: UserRole.Viewer,
  },
};

export function getMockUsers(): readonly User[] {
  return users;
}

export function setMockUsers(next: User[]): void {
  users = next;
}

export function resetMockDb(): void {
  users = createSeedUsers();
}

/** Whether the email is already used by another user. */
export function isEmailTaken(email: string, excludeId?: string): boolean {
  return users.some((user) => user.email === email && user.id !== excludeId);
}
