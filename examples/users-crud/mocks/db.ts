/**
 * In-memory mock database for the users-crud example, shared by the MSW
 * handlers. Reset between tests via `resetMockDb()`.
 *
 * The demo accounts for login (examples/auth/mocks/db.ts) resolve sessions
 * against this seed store by email, so ids here must stay stable.
 */

import { UserRole, UserStatus, type User } from '../models/user';

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
