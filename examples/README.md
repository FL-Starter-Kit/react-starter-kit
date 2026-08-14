# Examples

Reference/demo implementations, physically separated from the core starter so that shipping a client
project never drags demo business logic into `src/`. The core `src/` contains only the framework and
core features (`app/`, `components/`, `features/` for error pages, `lib/`, etc.).

Each example is a complete, runnable feature:

- **`auth/`** — the login reference: `LoginPage` (react-hook-form + Zod, redirect handling, friendly
  errors) plus the demo auth mock backend (`/api/auth/login|me|refresh|logout`) and demo accounts.
- **`users-crud/`** — the full CRUD reference feature: models, Zod schemas, typed API layer,
  TanStack Query hooks, filters/table/dialog components, list page with URL-driven state, plus its
  mock backend (`/api/users`) and integration tests.
- **`home/`** — the signed-in landing page (welcome + quick links).
- **`showcase/`** — a living preview of the UI primitives (design-system reference page).

## How the examples stay wired in

The starter remains fully runnable and demonstrable out of the box: `src/app/router/routes.tsx` lazy
imports the example pages and the MSW mock server (`src/tests/mocks/browser.ts` / `node.ts`)
registers the example handlers. Run `npm run dev` and explore `/`, `/users`, `/components` and
`/login`.

## Shipping a clean client project

To exclude demo business logic, remove the example wiring instead of the demo code:

1. Delete the routes that lazy-import example pages in `src/app/router/routes.tsx`.
2. Remove the example handlers from `src/tests/mocks/browser.ts` and `src/tests/mocks/node.ts`.
3. Remove the nav links in `src/app/layouts/AppHeader.tsx` that point at demo routes.
4. Delete the `examples/` directory (or copy only the examples you need into
   `src/features/<name>/`).

Your own features then live in `src/features/` as documented in `docs/ARCHITECTURE.md` and
scaffolded by `npm run generate feature <name>`.

## Portability

Examples import the core starter through the `@/` alias and their own internals through relative
paths, so a whole example can be copied into `src/features/<name>/` with minimal changes. The one
cross-example dependency is intentional: the `auth` mock resolves sessions against the users-crud
seed store (`examples/users-crud/mocks/db.ts`), so the signed-in identity matches the directory the
users example shows. Point it at your own identity store in a client project.
