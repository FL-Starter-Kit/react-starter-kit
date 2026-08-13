# Enterprise React Starter

A production-ready React starter application: TypeScript, Vite, React Router v8, TanStack Query,
accessible UI primitives, and a comprehensive test suite (unit, component, axe, integration,
Playwright E2E).

The repository demonstrates a complete, opinionated enterprise architecture — feature-oriented
folders, enforced dependency boundaries, URL-driven state, httpOnly-cookie auth with single-flight
refresh, mocked backend for development and tests, and documentation for every major decision (see
`docs/`).

## Prerequisites

- Node.js >= 22.22.0 (npm >= 10)
- Chromium for E2E tests: `npx playwright install chromium`

## Installation

```bash
npm install
```

No other setup is required for local development — the app runs fully against the MSW mock backend
(see [Environment configuration](#environment-configuration)).

## Development

```bash
npm run dev
```

Opens Vite's dev server at `http://localhost:5173` with the MSW mock backend enabled
(`.env.local.example` is copied to `.env.local` by default). Demo accounts are documented in
`src/tests/mocks/db.ts` (`admin@example.com` / `admin123`, plus `editor@` and `viewer@`).

Useful shortcuts:

| Command                       | What it does                                                   |
| ----------------------------- | -------------------------------------------------------------- |
| `npm run dev`                 | Start the dev server (MSW mocks on)                            |
| `npm run lint` / `lint:fix`   | ESLint (flat config, strict TS rules, architecture boundaries) |
| `npm run typecheck`           | `tsc --noEmit`                                                 |
| `npm run test` / `test:watch` | Vitest unit/component/integration tests                        |
| `npm run test:coverage`       | Vitest with v8 coverage (thresholds 70/70/70/60)               |
| `npm run test:e2e`            | Playwright E2E (needs Chromium installed)                      |
| `npm run test:a11y`           | Playwright tests tagged `@a11y` (axe scans)                    |
| `npm run format`              | Prettier on everything                                         |
| `npm run check`               | typecheck + lint + test + build in one shot                    |

## Production build

```bash
npm run build    # typecheck + vite build (lazy chunks per route)
npm run preview  # serve the built app locally
```

## Environment configuration

All configuration is runtime-validated by `src/app/config/env.ts` (Zod). Frontend environment
variables are **not secrets** — anything shipped to the browser can be inspected by users.

| Variable            | Default              | Purpose                                                                                             |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `''`                 | Backend base URL. Empty means "proxy via the Vite dev server" (`server.proxy` in `vite.config.ts`). |
| `VITE_ENABLE_MOCKS` | `false`              | Enable the MSW browser worker (dev only).                                                           |
| `VITE_LOG_LEVEL`    | `debug`              | `debug` / `info` / `warn` / `error` / `silent`.                                                     |
| `VITE_APP_NAME`     | `Enterprise Starter` | Document titles and branding.                                                                       |
| `VITE_PUBLIC_URL`   | `''`                 | Public deployment URL (canonical links, CSP).                                                       |

Copy `.env.example` to `.env.local` and adjust. `VITE_ENABLE_MOCKS=true` is already set in
`.env.local.example`.

## Project structure

```
src/
  app/          App shell: bootstrap, config, providers, router, layouts,
                error boundaries, guards
  components/   UI primitives (ui/), feedback/, layout/, navigation/
  features/     Feature-oriented modules (users, auth, home, docs, errors)
  hooks/        Shared hooks (useMediaQuery, useReducedMotion, useDebouncedValue)
  lib/          Framework-agnostic libraries (auth, http, logging, storage,
                accessibility)
  styles/       Design tokens + base styles (CSS Modules for components)
  tests/        Test infrastructure: MSW mocks, setup, render helpers, axe
  types/        Shared TypeScript types
  utils/        Pure helpers (cn, format, url, invariant)
e2e/            Playwright end-to-end tests
docs/           Architecture, testing, security, a11y, standards, ADRs
```

## Architectural principles

- **Feature-oriented modules.** Code that changes together lives together under `features/<name>/` —
  models, schemas, API layer, hooks, components, pages. No cross-feature imports (ESLint-enforced).
- **Dependency direction.** `components/` and `features/` may depend on `lib/`, `hooks/`, and
  `utils/`, never the other way around. Enforced with ESLint `no-restricted-paths` zones (see
  `docs/ARCHITECTURE.md`).
- **URL is state.** List filters and pagination live in search params, so they survive reloads and
  are deep-linkable.
- **Single HTTP client.** Every request goes through `src/lib/http/client.ts` — timeout, retries,
  correlation IDs, Zod response validation, and single-flight 401 refresh in one place.
- **Accessible by default.** Native elements (`<dialog>`, `<details>`, `<select>`) before custom
  widgets; WAI-ARIA patterns only where native widgets cannot do the job; axe in CI. See
  `docs/ACCESSIBILITY.md`.
- **Zero runtime UI framework.** CSS Modules + two-layer design tokens (raw primitives → semantic
  roles). No Tailwind, no component library.

## Testing

- **Unit** — pure logic: utils, permissions table, HTTP error normalization, retry/backoff, session
  refresh.
- **Component** — every UI primitive: behavior, keyboard interaction, and axe accessibility checks.
- **Integration** — the full app (theme + query + auth + router) against the MSW backend: the Users
  feature end-to-end (list, filter, pagination, create/edit/delete, loading/error/empty states),
  login flow, route guards, session refresh.
- **E2E** — Playwright against the mocked dev server, including `@a11y` tagged axe scans.

See `docs/TESTING.md` for details and conventions.

## Documentation

| Document                   | Covers                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| `docs/ARCHITECTURE.md`     | Folder structure, dependency rules, state management, API & auth architecture |
| `docs/TESTING.md`          | Test pyramid, MSW setup, testing-library conventions, gotchas                 |
| `docs/ACCESSIBILITY.md`    | A11y strategy, component patterns, verification                               |
| `docs/SECURITY.md`         | Threat model, auth/session design, XSS, secrets handling                      |
| `docs/CODING_STANDARDS.md` | TypeScript, ESLint, React, styling, commit conventions                        |
| `docs/CONTRIBUTING.md`     | Dev workflow, PR checklist, getting started                                   |
| `docs/adr/`                | Architecture Decision Records for the significant choices                     |

## License

Private starter template — no license yet.
