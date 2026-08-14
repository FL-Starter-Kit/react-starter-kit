# users-crud example

The reference CRUD feature: an admin directory of users demonstrating pagination, debounced search,
role/status filters, dialog forms with client + server validation, permission gating, and
loading/error/empty states. It is the canonical example for building a new feature.

## Anatomy

```
users-crud/
  models/user.ts        Types + constants (roles, statuses, list query, input)
  schemas/              Zod runtime schemas + react-hook-form form schema
  api/usersApi.ts       Endpoint definitions through the central HTTP client
  hooks/useUsers.ts     TanStack Query hooks + query keys + invalidation
  utils/userDisplay.ts  Pure display helpers (labels, initials, canDelete)
  components/           UserFilters, UserTable, UserFormDialog, UserStatusBadge
  pages/UsersPage.tsx   Page composition + URL-driven query state
  mocks/                MSW handlers + seed database + scenario knobs
  users-crud.test.tsx   Integration tests against the MSW backend
```

## Wiring into a client project

1. Copy the example into `src/features/users/` (internal imports are relative; `@/` resolves to the
   core starter).
2. Register a lazy route in `src/app/router/routes.tsx`:
   ```ts
   {
     path: 'users',
     element: <ProtectedRoute><Outlet /></ProtectedRoute>,
     children: [
       { index: true, lazy: () => import('@/features/users/pages/UsersPage').then(m => ({ Component: m.default })) },
     ],
   }
   ```
3. Register the mock handlers (or point at your real backend): add `usersHandlers` to
   `src/tests/mocks/browser.ts` and `src/tests/mocks/node.ts`.
4. Add a nav link in `src/app/layouts/AppHeader.tsx` and copy the permission table entries
   (`users:create|update|delete`) from `src/lib/auth/permissions.ts`.

## Tests

`users-crud.test.tsx` renders the full app (theme + query + auth + router) against MSW and covers
list, pagination, filters, search, empty/error/loading states, create, edit and delete. Run it with
`npm run test`.

## Mocks

- `mocks/db.ts` — 25 deterministic seed users (roles/statuses cycle; ids `user-1` … `user-25`). The
  auth example resolves login sessions against this store by id.
- `mocks/handlers.ts` — the `/api/users` CRUD handlers, shared by the browser worker and the Node
  test server.
- `mocks/scenario.ts` — `usersScenario` knobs (list delay, sticky failure status) for tests.
