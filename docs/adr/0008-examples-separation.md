# 0008 — Reference/demo features live in `examples/`, separate from the core starter

Date: 2026-08-13

## Status

Accepted

## Context

The starter shipped demo business logic inside the core source tree: a users CRUD reference feature,
a login page, a home landing page and a component showcase all lived under `src/features/`. A client
project starting from the template inherited that demo code and had to manually delete it — easy to
forget, and it made `src/` read as "sample app" instead of "framework". At the same time, the
reference implementations are the most valuable teaching material the starter has; removing them
altogether would lose the canonical feature anatomy, mock backend and test patterns.

The requirement: keep the actual project (`src/`) clean while preserving reference implementations.

## Options considered

1. **Keep demo features in `src/features/`.** Zero effort, but ships demo business logic to clients
   and blurs what the framework actually provides.
2. **Move demo features to `examples/`, fully un-wired.** Cleanest `src/`, but the starter no longer
   demonstrates anything when run (`npm run dev` shows only empty pages), and e2e/integration tests
   for the references would have to run outside the app's own test setup.
3. **Move demo features to `examples/`, wired into the runnable starter (chosen).** `src/` contains
   only framework + core features (error pages). The demo features physically live in `examples/` as
   portable modules that the router and mock server import through a dedicated `@examples/` alias,
   so the app remains fully runnable and demonstrable. Shipping a clean client project means
   deleting the example wiring (routes, mock handlers, nav links) rather than the demo code.

## Decision

- Reference/demo features live under `examples/`:
  - `examples/users-crud/` — the canonical CRUD reference (models, schemas, api, hooks, utils,
    components, pages, mocks, integration tests).
  - `examples/auth/` — the login reference (LoginPage + demo auth mock handlers + demo accounts).
  - `examples/home/` and `examples/showcase/` — the landing page and the UI showcase.
- The core app stays wired to them: `src/app/router/routes.tsx` lazy-imports the example pages, and
  `src/tests/mocks/browser.ts` / `node.ts` compose the example handlers with the core session store
  (`src/tests/mocks/session.ts`) and scenario knobs.
- A dedicated path alias `@examples/` maps to `examples/` (tsconfig + Vite + ESLint resolver).
- Examples import the core starter via `@/` and their own internals via relative paths, so a whole
  example can be copied into `src/features/<name>/`.
- The one cross-example dependency is deliberate and lint-exempted: the auth mock resolves sessions
  against the users-crud seed store (`examples/users-crud/mocks/db.ts`), so the signed-in identity
  matches the directory the users example shows.

## Consequences

- `src/features/` is reduced to core features only (currently error pages); new features a client
  adds go in `src/features/` as before.
- Demo business logic (users CRUD, demo accounts, mock handlers, seed data) no longer lives in the
  core tree.
- The starter still runs the demos out of the box, so onboarding, e2e and integration tests keep
  exercising the references.
- Shipping clean requires removing example wiring (documented in `examples/README.md`) instead of
  deleting demo code.
- ESLint `no-restricted-paths` now enforces feature boundaries inside `examples/` too (no
  cross-example imports except the documented auth → users-crud seed dependency).
- Cost: two path aliases (`@/`, `@examples/`); documentation must keep the "wired vs shipped" story
  clear; the auth example is not fully standalone (depends on the users-crud identity store).
