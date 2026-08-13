/**
 * Demo accounts for the login form. Each account maps to a seeded user in
 * `examples/users-crud/mocks/db.ts` by id — the auth mock resolves sessions
 * against that identity store — and the role must match that seed user's
 * role (Admin/Editor/Viewer cycle).
 */
export interface DemoAccount {
  /** Seeded user this account maps to (see examples/users-crud/mocks/db.ts). */
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export const demoAccounts: readonly DemoAccount[] = [
  { id: 'user-1', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { id: 'user-2', email: 'editor@example.com', password: 'editor123', role: 'editor' },
  { id: 'user-3', email: 'viewer@example.com', password: 'viewer123', role: 'viewer' },
];
