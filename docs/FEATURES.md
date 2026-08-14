# Features

What the starter kit provides, grouped by concern. Every feature below is implemented, tested, and
documented in this repository.

## 1. Core stack

| Area         | Choice                                                              |
| ------------ | ------------------------------------------------------------------- |
| Language     | TypeScript 5.9 (strictest settings)                                 |
| Build / dev  | Vite 8 (lazy route-level chunks)                                    |
| UI           | React 19                                                            |
| Routing      | React Router v8 (URL-driven state)                                  |
| Server state | TanStack Query 5                                                    |
| Forms        | React Hook Form + Zod 4 schemas                                     |
| Styling      | CSS Modules + design tokens (primitive + semantic), no UI framework |
| API mocking  | MSW (browser worker + Node server)                                  |
| Testing      | Vitest, Testing Library, Playwright                                 |

## 2. Application (shipped routes)

The demo routes below are backed by reference features living in `examples/` (see
`docs/adr/0008-examples-separation.md`). They are wired into the runnable starter so it can be
explored, but they are not part of the core `src/` a client project ships; delete the example wiring
to start clean.

- **Home page** — `/` landing page.
- **Login** — `/login` sign-in form with real credential validation and friendly errors.
- **Users feature** — `/users`, an admin CRUD reference feature:
  - paginated table (25 seeded users, 10 per page)
  - debounced search and role/status filters — state lives in the URL (deep-linkable, survives
    reloads)
  - create / edit via dialog forms with client-side and server-side field validation
  - delete with confirmation, self-delete protection
  - role/status badges, loading skeletons, empty and error states
- **Component showcase** — `/components`, a living preview of the UI primitives.
- **Error pages** — `/unauthorized` and not-found (`*`), plus route-level error screens and an
  app-wide `AppErrorBoundary`. These are core `src/features/errors/`.

## 3. Authentication & authorization

- **httpOnly-cookie session** with bootstrap restore via `/api/auth/me`.
- **Single-flight silent refresh**: when requests hit 401, the refresh endpoint is called exactly
  once and all concurrent failures await the same promise, then retry (see
  `src/lib/auth/refreshSession.ts`).
- **Session state machine** (`loading` / `authenticated` / `unauthenticated`) exposed via
  `AuthProvider` (`src/lib/auth/AuthContext.tsx`).
- **Route guards**: `ProtectedRoute` redirects anonymous visitors to `/login`, remembering the
  attempted URL and returning them after login.
- **Permission gating**: `PermissionGate` / `RoleGate` UI primitives backed by an exhaustively
  unit-tested permission table (`src/lib/auth/permissions.ts`). Three demo roles: admin, editor,
  viewer.

## 4. UI primitives (`src/components/`)

Accessible, keyboard-friendly components built on native elements first (no component library):

- **Controls**: Button, IconButton, Input, Select, Checkbox, Radio, Switch, Textarea, FormField,
  Label, FieldControl
- **Overlays**: Dialog (native `<dialog>`), Drawer, DropdownMenu, Tooltip
- **Navigation**: MainNav, Breadcrumbs (route-table driven via `handle.crumb`), Pagination, Tabs
- **Layout & feedback**: Alert, Spinner, Skeleton, EmptyState, ErrorState, Badge, Accordion,
  Container, PageHeader

Every primitive ships with component tests covering behavior, keyboard interaction, and axe
accessibility checks. A `liveRegion` helper (`src/lib/accessibility/`) provides polite async-region
announcements.

## 5. HTTP & API layer (`src/lib/http/`)

One centralized client — no raw `fetch` in features:

- timeout (15s default) + external `AbortSignal` cancellation
- retries with exponential backoff + jitter for network errors and 408/429/5xx, honoring
  `Retry-After`
- request/response logging with correlation IDs (`X-Request-Id`)
- Zod runtime validation of every response — untrusted server data never used untyped
- normalized, typed errors (`ApiError`) with mapped status codes and per-field error envelopes
- single-flight 401 → refresh → retry pipeline integration

## 6. App shell & infrastructure

- **Runtime-validated environment config** (`src/app/config/env.ts`, Zod) with documented variables
  and sensible defaults.
- **Theme system**: light / dark / system modes via CSS custom properties, media-query driven with
  `prefers-color-scheme`, persisted securely through a storage wrapper.
- **Structured logger** (`src/lib/logging/`) with severity levels and request context; runtime log
  level via `VITE_LOG_LEVEL`.
- **Safe storage wrapper** (`safeStorage`) that degrades gracefully when localStorage is blocked.
- **Shared hooks**: `useDebouncedValue`, `useMediaQuery`, `useReducedMotion`.
- **Utilities**: `cn` (class merging), `format`, `url` helpers, `invariant`.
- **Lazy-loaded routes** with per-route error elements and breadcrumbs.

## 7. Mock backend (MSW)

- Core plumbing in `src/tests/mocks/` (session store, scenario knobs, browser/node bootstrap); demo
  handlers live with their examples: `examples/auth/mocks/` and `examples/users-crud/mocks/`.
- In-memory seeded database: 25 users (deterministic order/roles/status — see `docs/TESTING.md`
  §6) + demo accounts (`admin@example.com` / `admin123`, plus `editor@` and `viewer@`) defined in
  `examples/auth/mocks/db.ts` and mapped to the seed in `examples/users-crud/mocks/db.ts`.
- Same MSW handlers power dev (browser worker, persistent localStorage session) and tests (Node
  server, `setActiveSession`).
- Test knobs: session lifecycle in `src/tests/mocks/scenario.ts` (session expiry, login rejection),
  users list in `examples/users-crud/mocks/scenario.ts` (response delays, sticky failure flags).

## 8. Quality & testing

Four testing layers, all configured and runnable:

| Layer       | Tooling                  | Coverage                                                |
| ----------- | ------------------------ | ------------------------------------------------------- |
| Unit        | Vitest + jsdom           | utils, permissions, HTTP errors, retry/backoff, refresh |
| Component   | Vitest + Testing Library | every UI primitive + axe checks                         |
| Integration | Vitest + MSW             | full app flows: users CRUD, login, guards, refresh      |
| E2E         | Playwright (chromium)    | auth journey, users CRUD, `@a11y` axe scans             |

- axe accessibility scanning at every layer (component tests + `e2e/a11y.spec.ts` tagged `@a11y`).
- Coverage thresholds enforced (70/70/70/60), lint via ESLint flat config (strict TS, `react-hooks`,
  `jsx-a11y`, import ordering, architecture-boundary rules), Prettier formatting.
- **CI** (`.github/workflows/ci.yml`): quality (typecheck, lint, format) and tests (Vitest +
  coverage thresholds) run in parallel with the production build; Playwright E2E (incl. `@a11y`
  scans) runs after the build succeeds, with the HTML report uploaded on failure.
- **Security** (`.github/workflows/security.yml`): `npm audit --audit-level=high` and dependency
  review on dependency changes plus nightly runs.

## 9. Developer experience

- One-command gates: `npm run dev` (app + mocks), `npm run check` (typecheck + lint + test + build),
  `npm run test:e2e`, `npm run test:a11y`, `npm run format`.
- **Code generators** (`npm run generate feature|component|hook|api`): scaffold idiomatic,
  lint-clean skeletons for features, components, hooks and API layers — see `docs/CONTRIBUTING.md`
  §8.
- Husky + lint-staged git hooks; Conventional Commits enforced in contributing docs.
- Architecture enforced by tooling: feature-oriented modules, no cross-feature imports, one-way
  dependency direction (`components`/`features` → `lib`/`hooks`/`utils`).
- Complete documentation: architecture, testing conventions, accessibility strategy, security threat
  model, coding standards, contributing guide, and ADRs for every major decision (`docs/`).
