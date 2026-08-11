# Architecture

This document explains the actual structure and rules of the repository. It is the reference for the
architecture decisions, and the ESLint configuration enforces the most important rules mechanically
(see [Enforcement](#enforcement)).

## 1. Overview

The application is a **feature-oriented React SPA**:

- **Vite** build tool with React 19 and TypeScript (strict).
- **react-router v8** (ESM, `react-router/dom`) with lazy routes.
- **TanStack Query v5** for server state.
- **React Hook Form + Zod** for forms (client + runtime validation).
- **CSS Modules + design tokens** for styling — no runtime UI framework.
- **MSW** mock backend for development and tests.

```
Browser → HTTP client (lib/http) → backend
                    ↓ 401
            single-flight refresh (lib/auth)
Browser ← components/features ← lib/hooks/utils
```

## 2. Directory layout

```
src/
  app/            Application shell — composition only
    bootstrap/    Entry wiring: load config → configure HTTP client → MSW → render
    config/       Zod-validated environment configuration (env.ts)
    providers/    QueryProvider, ThemeProvider, context files
    router/       Static route table (routes.tsx) + AppRouter
    layouts/      RootLayout, AuthLayout, AppHeader
    errors/       Error boundaries + route error screens
    guards/       ProtectedRoute, PermissionGate, RoleGate, SessionLoader
  components/     Reusable presentational components
    ui/           Primitives: Button, Dialog, DropdownMenu, Tabs, Pagination, ...
    feedback/     Alert, EmptyState, ErrorState
    layout/       Container, PageHeader
    navigation/   Breadcrumbs, MainNav
  features/       Feature-oriented modules — the unit of ownership
    users/        models/, schemas/, api/, services/, hooks/, components/, pages/
    auth/         pages/ (login)
    docs/         pages/ (live component showcase)
    errors/       pages/ (404, 403)
    home/         pages/
  hooks/          Cross-cutting hooks (useMediaQuery, useReducedMotion, useDebouncedValue)
  lib/            Framework-agnostic libraries — no React components
    auth/         Session model, permissions, token storage, refresh, context
    http/         Typed HTTP client (retries, timeout, validation, 401 refresh)
    logging/      Logger with context + sanitization
    storage/      safeStorage (try/catch + in-memory fallback)
    accessibility/ announce() live regions
  styles/         tokens.css (design tokens), base.css (reset/utilities)
  tests/          MSW mocks, setup, render helpers, axe utilities
  types/          Shared types (api, branded)
  utils/          Pure helpers with no app dependencies
e2e/              Playwright specs
docs/             Architecture, testing, a11y, security, ADRs
```

## 3. Feature module anatomy

A feature owns everything it needs, organized by role:

```
features/users/
  models/user.ts       Types + constants (no logic)
  schemas/             Zod runtime schemas + React Hook Form schemas
  api/usersApi.ts      Endpoint definitions using the HTTP client
  services/            Pure domain logic (labels, initials, permissions)
  hooks/useUsers.ts    TanStack Query hooks + query keys + invalidation
  components/          Feature-specific UI (table, filters, form dialog)
  pages/UsersPage.tsx  Page composition + URL state
```

Rules for features:

- A feature may import from `app`, `components`, `hooks`, `lib`, `utils`, `types` — and **never from
  another feature** (except its own subfolder).
- Pages stay thin: they compose components and hook into server state; business logic lives in
  services and hooks.
- The API layer is the only place that knows the HTTP endpoints of that feature.

## 4. Dependency rules and enforcement

Dependency direction is bottom-up:

```
utils, types  ←  hooks  ←  lib  ←  components  ←  features  ←  app
```

| Zone          | May import                                     | Must not import                                                            |
| ------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `components/` | `lib`, `hooks`, `utils`, `types`               | `app`, `features`                                                          |
| `features/`   | `components`, `lib`, `hooks`, `utils`, `types` | other features                                                             |
| `hooks/`      | `utils`, `types`                               | `components`, `features`, `lib` (components), `app`                        |
| `lib/`        | `utils`, `types`                               | `components`, `features`, `app` (no React components in lib)               |
| `app/`        | everything                                     | anything from `lib` that imports components (design keeps this impossible) |

**Enforcement.** `eslint.config.js` uses `no-restricted-paths` zones so violations fail lint. When a
boundary is violated, fix it architecturally (move the code) rather than adding a rule exception.
Known historical violations and their fixes are documented in `PROGRESS.md`.

## 5. State management

| State kind              | Mechanism                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Server state            | TanStack Query hooks in `features/<name>/hooks/`; query keys centralized next to the hooks |
| URL state               | `useSearchParams` — filters, pagination, return paths live in the URL                      |
| Theme                   | React context (`ThemeProvider`), persisted via `safeStorage`                               |
| Auth session            | React context fed by `lib/auth`; single source of truth is the backend session             |
| Local UI state          | `useState` inside the component that owns it (dialog open state, etc.)                     |
| Server mutation results | `announce()` into an aria-live region, never `alert()`                                     |

Key conventions:

- Mutations invalidate their query keys on success (`invalidateQueries`), never optimistically write
  to the cache unless a detail row is the target (`setDetail`).
- List queries use `placeholderData: keepPreviousData` so pagination never flashes a skeleton.
- **StaleTime/retries:** production uses sensible defaults (refetch on window focus off); tests
  configure `staleTime: Infinity, retry: false` for determinism (`src/tests/render.tsx`).

## 6. HTTP / API architecture

All requests flow through `src/lib/http/client.ts`:

- **Timeout + cancellation** — external `AbortSignal` support (TanStack Query cancellation).
- **Retry** — exponential backoff with jitter for network failures and 408/429/5xx, honoring
  `Retry-After`.
- **Correlation IDs** — `X-Request-Id` on every request, logged with the request lifecycle.
- **Runtime validation** — response payloads are validated with Zod at the API layer; a violated
  contract fails loudly for developers and generically for users.
- **Normalized errors** — every failure becomes a typed `ApiError` with a stable `ErrorCode`;
  `fieldErrors` feed form validation.
- **401 handling** — a single-flight session refresh: the first 401 triggers one refresh request,
  concurrent failures await it, then the original request is retried once. Login/refresh/logout
  endpoints opt out via `skipUnauthorizedHandler` to avoid re-entrancy.

The client is configured once in bootstrap from the validated environment (`lib/http/configure.ts`).

## 7. Auth architecture

- **Session**: httpOnly-cookie based. The JS bundle never sees the token; the backend sets/clears
  cookies and `GET /api/auth/me` is the source of truth for the session.
- **Frontend model**: `SessionUser` (id, email, name, role) + a static permission table
  (`users:create`, `users:update`, `users:delete`). Guards (`ProtectedRoute`, `PermissionGate`,
  `RoleGate`) gate routes and UI.
- **Refresh**: on any 401 (except auth endpoints), `refreshSession` runs a single-flight silent
  refresh, then the original request retries once. Failure redirects to `/login?returnPath=...`.
- **Logout** is an API call (invalidates the cookie) followed by a client-side session clear.
- **Demo accounts** live in `src/tests/mocks/db.ts`; the mock backend emulates cookies in the
  browser and falls back to module state under Node (tests call `setActiveSession('user-1')`).

## 8. Routing

- Static route table in `src/app/router/routes.tsx`; pages are lazy-loaded (`React.lazy`), producing
  per-route chunks.
- Guards wrap protected routes: `<ProtectedRoute>` (session required),
  `<PermissionGate>`/`<RoleGate>` (capability required).
- Routes carry `handle: { crumb }` for breadcrumbs (`useRouteBreadcrumbs`).
- Error boundaries: route-level `AppErrorBoundary` (keyed by location so navigation resets the
  boundary) + root `GlobalErrorBoundary`, and a `RouteErrorScreen` that renders differently for
  404/403/500.

## 9. Styling

- **CSS Modules** per component; global **design tokens** in `src/styles/tokens.css` (colors incl.
  dark mode, spacing, type, radius, shadow, z-index, breakpoints, transitions, focus rings,
  high-contrast overrides).
- Dark mode via `[data-theme='dark']` on the document root, controlled by `ThemeProvider` and
  persisted in `safeStorage`.
- `classNameStrategy: 'non-scoped'` keeps readable class names in tests.
- Components never import each other's CSS; shared primitives take `className` and merge with `cn`.

## 10. Mocks (MSW)

- Handlers in `src/tests/mocks/handlers.ts` (auth + users CRUD), in-memory database in `db.ts`,
  mutable test knobs in `scenario.ts` (delays, sticky failure flags, session expiry).
- Browser worker (`public/mockServiceWorker.js`, committed) enables development without a backend:
  `VITE_ENABLE_MOCKS=true`.
- Node server (`setupServer`) powers all Vitest tests; reset via `resetMockServer()` in
  `src/tests/setup.ts`.
- Scenario flags are **sticky until reset** on purpose: the HTTP client retries 5xx, so one-shot
  flags would be consumed by the first attempt and never surface an error state.

## 11. i18n and timezones

- The architecture keeps all user-facing strings in one place per component and centralizes
  formatting in `src/utils/format.ts` (Intl-based). Locale switching is not wired yet; adding it
  must not change component APIs.
- All dates are ISO-8601 UTC on the wire and formatted with explicit `timeZone` (defaults to UTC) —
  never `Date.toString()` in UI.

## 12. Browser support

- Chromium (latest), Firefox (latest), Safari (latest two) — the primary target is evergreen modern
  browsers.
- Progressive enhancement matters more than legacy support; native `<dialog>`, `:has()`, and
  container queries are used freely.

## 13. Documentation of decisions

Significant choices are recorded as Architecture Decision Records in `docs/adr/`. Each ADR states
the context, the decision, and the consequences. See `docs/adr/README.md` for the index.
