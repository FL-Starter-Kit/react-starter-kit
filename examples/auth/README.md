# auth example

The login reference: the sign-in page (`LoginPage`) plus the demo auth backend it talks to. The core
auth infrastructure (session model, permissions, token storage, single-flight refresh,
`AuthProvider`) lives in `src/lib/auth/` and ships with every project; this example demonstrates the
UI and the mock endpoints on top of it.

## Anatomy

```
auth/
  pages/LoginPage.tsx   Sign-in form (react-hook-form + Zod), redirect handling, friendly errors
  mocks/db.ts           Demo accounts (admin / editor / viewer)
  mocks/handlers.ts     /api/auth/login|me|refresh|logout mock handlers
  login.test.tsx        Integration tests: login flow + session lifecycle
```

## Demo accounts

| Email                | Password    | Role   |
| -------------------- | ----------- | ------ |
| `admin@example.com`  | `admin123`  | Admin  |
| `editor@example.com` | `editor123` | Editor |
| `viewer@example.com` | `viewer123` | Viewer |

Each account maps to a seeded user in `examples/users-crud/mocks/db.ts` by id — the mock resolves
sessions against that identity store so the signed-in identity matches the directory shown by the
users example. `src/lib/auth/permissions.ts` defines what each role may do.

## Wiring into a client project

1. Copy the example into `src/features/auth/`.
2. Register the route in `src/app/router/routes.tsx`:
   ```ts
   {
     path: '/login',
     element: <AuthLayout />,
     children: [{ index: true, lazy: () => import('@/features/auth/pages/LoginPage').then(m => ({ Component: m.default })) }],
   }
   ```
3. Register `authHandlers` in `src/tests/mocks/browser.ts` and `src/tests/mocks/node.ts` (or use
   your real backend).

## Tests

`login.test.tsx` covers invalid credentials, client-side validation, successful sign-in + redirect,
guard-driven return path, sign-out, and the single-flight refresh / session-expiry lifecycle.
