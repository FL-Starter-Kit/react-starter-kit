# Enterprise React Starter — Build Progress

Tracking file so work can be stopped and resumed at any time.
Last updated: 2026-08-11 (5th session).

**Resume here:** run `npm install` if `node_modules` is missing, then continue from the next unfinished phase below. After each phase, run `npm run check` (`typecheck` + `lint` + `test` + `build`) before moving on.

**Current status (5th session):** **E2E suite fully green** — 16/16 Playwright tests (auth journey, users CRUD, @a11y axe scans) passing consistently, plus **223 Vitest tests across 25 files**; `tsc --noEmit`, `eslint .` all clean. Fixed the login return-path regression (StrictMode double-mount), a rapid-filter race in UsersPage, MSW browser cookie emulation, and an axe critical on the showcase page. Next up: husky hook init (`npm run prepare`-style) + final `npm run check`.

---

## Stack (locked versions, verified compatible)

| Area | Choice | Version |
|---|---|---|
| Build | Vite | ^8.2.1 |
| Runtime | React | ^19.2.8 |
| Language | TypeScript | ~5.9.3 (NOT 7.x — typescript-eslint requires <6.1) |
| Routing | react-router (v8, ESM, `react-router/dom`) | ^8.3.0 |
| Server state | TanStack Query | ^5.101.4 |
| Forms | React Hook Form + @hookform/resolvers + Zod | ^7.85.0 / ^5.7.1 / ^4.4.3 |
| Styling | CSS Modules + CSS custom-property tokens (zero deps) | — |
| Unit/component tests | Vitest + jsdom + Testing Library | ^4.1.10 / ^30.0.1 / ^16.3.2 |
| A11y tests | axe-core (direct, no jest-axe) + @axe-core/playwright | ^4.13.0 / ^4.12.1 |
| E2E | Playwright | ^1.62.1 |
| API mocking | MSW | ^2.15.0 |
| Lint | ESLint ^9.39.5 (NOT 10 — jsx-a11y peer conflict) + typescript-eslint ^8.66.0 | — |
| Import resolution | eslint-import-resolver-typescript (added 3rd session) | ^4.4.5 |
| Format | Prettier | ^3.9.6 |
| Git hooks | husky + lint-staged (config in package.json, hook NOT yet initialized) | — |

---

## Phase 1 — Scaffolding & Architecture ✅ DONE

- [x] `package.json` with all scripts + pinned dependency set; `npm install` succeeded
- [x] Architecture laid out per master prompt (feature-oriented, see `docs/ARCHITECTURE.md` — TODO)

## Phase 2 — Foundation ✅ DONE (config files)

- [x] `tsconfig.json` — strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + noImplicitOverride + verbatimModuleSyntax, `@/*` alias
- [x] `vite.config.ts` — react plugin, alias, vitest config (jsdom, setup, coverage thresholds 70/70/70/60)
- [x] `eslint.config.js` — flat config, strict TS rules, react-hooks, jsx-a11y, react-refresh, import-x/order, **architecture boundary zones** (no-restricted-paths)
- [x] `.prettierrc.json`, `.editorconfig`, `.gitignore`
- [x] `.env.example` + `.env.local.example` (VITE_API_BASE_URL, VITE_ENABLE_MOCKS, VITE_LOG_LEVEL, VITE_APP_NAME, VITE_PUBLIC_URL)
- [x] `playwright.config.ts` — chromium project, webServer with `VITE_ENABLE_MOCKS=true`, `@a11y` tag support
- [x] `index.html` (lang, meta, root div)
- [x] `src/styles/tokens.css` — full design token set (colors light/dark, spacing, type, radius, shadow, z-index, breakpoints, transitions, focus, high-contrast media query)
- [x] `src/styles/base.css` — reset, focus-visible, skip-link, reduced-motion, `.visually-hidden`

## Phase 2b — Infrastructure ✅ DONE (all files written, NOT yet verified)

- [x] `src/utils/` — cn, invariant, format (Intl date/number/currency, UTC assumption documented), url (open-redirect guards)
- [x] `src/types/api.ts` (Paginated, PaginationParams, ErrorCode) + `src/types/branded.ts`
- [x] `src/lib/logging/logger.ts` — levels, context (requestId), sanitize/redact, transport extension point (Sentry/OTel), no console.log elsewhere (ESLint-enforced)
- [x] `src/lib/storage/safeStorage.ts` — try/catch + in-memory fallback wrappers (ESLint-enforced)
- [x] `src/lib/http/` — typed ApiError normalization, timeout+cancellation, backoff retries (Retry-After aware), runtime validation hooks, correlation IDs, single-flight 401 refresh via `setUnauthorizedHandler`, `configureHttpClient` + `httpClient` singleton
- [x] `src/lib/auth/` — types (Role/Permission/SessionUser), permissions table, tokenStorage (cookie strategy + sessionStorage return-path, validated), authApi (zod-validated), refreshSession (single-flight), AuthContext provider, guards (ProtectedRoute/PermissionGate/RoleGate/SessionLoader)
- [x] `src/hooks/` — useMediaQuery, useReducedMotion, useDebouncedValue
- [x] `src/lib/accessibility/liveRegion.ts` — announce() polite/assertive

## Phase 2c — App shell ✅ DONE (files written; typecheck not yet green)

- [x] `src/app/config/env.ts` — zod-validated env config, `loadConfig()`/`getConfig()`, log level wiring
- [x] `src/app/providers/` — QueryProvider (retry policy, refetchOnWindowFocus off, global error log), ThemeProvider (light/dark/system + persistence via safeStorage)
- [x] `src/app/router/` — `routes.tsx` (lazy pages, `handle.crumb`, ProtectedRoute wraps Users/Components, AuthLayout on `/login`), `AppRouter.tsx` (createBrowserRouter from `react-router`, RouterProvider from `react-router/dom`)
- [x] `src/app/layouts/` — RootLayout (skip link → #main, header/footer), AuthLayout (centered card), AppHeader (nav, theme cycle button, user DropdownMenu with sign-out)
- [x] `src/app/errors/` — AppErrorBoundary (keyed by location) + GlobalErrorBoundary class + RouteErrorScreen (404/403/500-aware)
- [x] `src/app/bootstrap/bootstrap.tsx` — loadConfig → configureHttpClient → optional MSW browser worker → render providers
- [x] `src/main.tsx` entry

## Phase 3 — UI primitives ✅ DONE (all 21 written)

- [x] Button · IconButton (aria-label required) · Spinner · Badge · Label · FormField
- [x] Input · Textarea · Select · Checkbox · Radio/RadioGroup · Switch (role=switch)
- [x] Tooltip (cloneElement + aria-describedby) · Dialog + Drawer (native `<dialog>`, focus trap/ESC via platform) · DropdownMenu (WAI-ARIA menu pattern, arrow keys) · Tabs (roving tabindex) · Accordion (native details/summary)
- [x] Skeleton · Pagination (aria-current, page window + ellipsis)
- [x] feedback/ (Alert role=alert|status, EmptyState, ErrorState) · layout/ (Container, PageHeader) · navigation/ (Breadcrumbs + useRouteBreadcrumbs, MainNav)
- [x] Barrels: `components/ui/index.ts`, `feedback/index.ts`, `layout/index.ts`, `navigation/index.ts`

## Phase 4 — Features ✅ DONE (files written; typecheck not yet green)

- [x] `features/users/`: models/user.ts, schemas/userSchemas.ts (zod runtime validation), schemas/userFormSchemas.ts (RHF), api/usersApi.ts, services/usersService.ts (labels/initials/canDelete), hooks/useUsers.ts (list/detail/create/update/delete, keepPreviousData, invalidation), components/ (UserTable, UserFilters, UserFormDialog, UserStatusBadge), pages/UsersPage.tsx (URL search-param state, loading/error/empty states, create/edit dialogs, delete confirm dialog, announce() on mutations)
- [x] `features/auth/pages/LoginPage.tsx` (RHF + zod, error mapping, redirect back to returnPath)
- [x] `features/home/pages/HomePage.tsx`, `features/errors/pages/NotFoundPage.tsx` + `UnauthorizedPage.tsx`, `features/docs/pages/ComponentsPage.tsx` (live UI showcase)

## Phase 5 — MSW + test infra ✅ DONE (223 tests green, 25 files)

- [x] `src/tests/mocks/` — db.ts (25 seeded users + demo accounts), scenario.ts (expireNextRequest, rejectLogin, **failListWith** (renamed from failNextListWith — sticky until reset, see gotchas), listDelayMs), handlers.ts (auth: login/me/refresh/logout with httpOnly cookie emulation; users: CRUD + validation 422 + self-delete 403 + 404/500), node.ts (setupServer + resetMockServer), browser.ts (setupWorker)
- [x] `src/tests/setup.ts` (jest-dom/vitest, MSW server lifecycle) · `src/tests/render.tsx` (renderWithProviders w/ memory router) · `src/tests/renderApp.tsx` (full-app render: ThemeProvider + QueryClient + AuthProvider + memory router + lazy-route settle) · `src/tests/a11y.ts` (axe-core direct: expectNoAxeViolations, renderAndCheckA11y)
- [x] `npx msw init public/ --save` — service worker committed (`public/mockServiceWorker.js`, `msw.workerDirectory` in package.json)
- [x] **Component tests for every UI primitive** (incl. axe checks) — `src/components/**/*.test.tsx`
- [x] **Unit tests**: utils (cn/format/url), permissions, logger sanitize, http client error normalization + retry/backoff/401-refresh, auth refreshSession
- [x] **Integration tests** (15 in `src/features/users/users-page.test.tsx`): UsersPage list/filter/pagination/loading skeleton/error+retry/create (incl. client + server validation)/edit/delete/own-account-delete — all against the seeded mock backend
- [x] `e2e/` — auth journey, users CRUD, `@a11y` axe scans (needs `npx playwright install chromium`; **done 5th session** — 16/16 green)

## Phase 6 — Documentation ✅ DONE

- [x] `README.md` — prerequisites, install, dev, testing, production build, env configuration, project structure, architectural principles
- [x] `docs/ARCHITECTURE.md` — folder layout, feature anatomy, dependency rules + enforcement, state, HTTP/API, auth, routing, styling, mocks, i18n/timezone, browser support
- [x] `docs/ACCESSIBILITY.md` — native-first strategy, component patterns table, contrast/focus/reduced-motion, 3-layer verification, writer checklist
- [x] `docs/SECURITY.md` — threat model, httpOnly sessions, XSS defenses, VITE_* non-secrets, supply chain, CSP checklist, logging
- [x] `docs/TESTING.md` — test pyramid, infra helpers, MSW/scenario conventions, TL queries + the 6 gotchas
- [x] `docs/CONTRIBUTING.md` — setup, workflow, PR checklist, commit conventions, "add a feature" walkthrough
- [x] `docs/CODING_STANDARDS.md` — TS/React/ESLint/styling/testing rules, naming, comments, version pinning
- [x] `docs/adr/` — README index + 7 ADRs (build tooling, state, styling, folder structure, API architecture, a11y, auth)
- [x] `.github/workflows/ci.yml` — verify job (typecheck → lint → format → unit → coverage → build → audit) + Playwright job (skipped until `e2e/` exists, uploads report on failure)

## Phase 7 — Final review ✅ DONE (typecheck + lint + tests + build all green)

**4th session: test suite + full documentation complete.** `tsc --noEmit` → 0 errors, `eslint .` → 0 problems, `npm run test` → **222 tests / 25 files green**, `npm run build` → succeeds. Remaining: E2E (Phase 5 checkbox) and the husky hook init.
- [x] `npx tsc --noEmit` → 0 errors
- [x] `npx eslint .` → 0 errors, 0 warnings (was 556 errors + a config crash)
- [x] `npm run build` → succeeds (vite build, lazy chunks fine)
- [x] `npm run test` → **222 tests / 25 files green** (unit + component + axe + integration; 223 since the 5th session)

**Root causes found & fixed in the 3rd session (see gotchas for details):**
- [x] eslint.config.js SyntaxError: `features/*/` inside a JSDoc comment contains `*/` → prematurely closes the block comment
- [x] import-x resolver: v4 removed `import-x/resolver: { typescript }` → use `import-x/resolver-next` + `createTypeScriptImportResolver` (needs `eslint-import-resolver-typescript`); also `excludeFiles` is not a zone option (schema: target/from/except/message)
- [x] no-restricted-paths `except` is resolved **relative to `from`** and must be a plain directory (glob `**` breaks `containsPath`) → `except: ['./users']` / `except: ['./auth']`
- [x] Zone boundary violations resolved architecturally:
  - `lib/auth/guards.tsx` (imported Spinner from components/ui) → moved to `src/app/guards/guards.tsx`; `lib/auth` no longer re-exports it
  - `lib/http/configure.ts` (imported `AppConfig` from app) → now takes `{ baseUrl, defaultTimeoutMs }` plain object; bootstrap maps it
- [x] `refreshSession.ts` bug: `const onSessionRestored` self-assign → module-level `let` listener + `refreshPromise ??=` (also fixed prefer-nullish-coalescing)
- [x] ErrorCode switches made exhaustive (12 codes) in client.ts + errors.ts (switch-exhaustiveness-check)
- [x] react-hooks v7 `set-state-in-effect`: UserFilters + UserFormDialog use the React-sanctioned **guarded render-time adjustment** pattern (`if (key !== lastKey) setState(...)`); UserFormDialog keeps `reset()` in the effect (external system) — `set-state-in-render` only flags *unconditional* render setState
- [x] `useMediaQuery` rewritten with `useSyncExternalStore` (no effect at all)
- [x] `no-misused-promises` on `handleSubmit(...)`: RHF types it as `(e) => Promise<void>` → wrap: `onSubmit={(e) => { void submitForm(e); }}`; navigate() → `void navigate(...)`; extracted `signIn`/`saveUser` async fns
- [x] react-refresh warnings → split hooks/contexts from components: `themeContext.ts` (ThemeContext+useTheme), `useRouteBreadcrumbs.ts`, `lib/auth/context.ts` (AuthContext+useAuthContext); routes.tsx file-level disable (static route table)
- [x] prefer-nullish-coalescing configured with `ignorePrimitives: true` (booleans keep `||` semantics)
- [x] logger.ts: renamed private `.log()` → `.write()` (no-restricted-syntax matched `this.log(...)`); console calls get targeted disables (module IS the sanctioned gateway); sanitize array cast fix
- [x] env.ts: `import.meta.env` cast to `Record<string, string | undefined>` (was unsafe any)
- [x] Label.tsx: file-level jsx-a11y disable (htmlFor passed by caller — FormField); Radio: inline disable for aria-invalid (global ARIA attr); Switch: dropped unused `type`; Tabs: `tabIndex={0}` on tablist; DropdownMenu ternary → if/else

**Next commands when resuming:**
1. Husky hook init (`npm run prepare`-style), final `npm run check`
2. E2E currently runs with `VITE_ENABLE_MOCKS=true` + Playwright chromium; in this sandbox chromium needs `LD_LIBRARY_PATH=/tmp/opencode/e2e-libs/extracted/usr/lib/x86_64-linux-gnu` (missing libnspr4/libnss3 system libs)

---

## 5th session — E2E green + regression fixes ✅

**E2E suite fully passing** (16/16, repeated runs, no flakes) + **223 Vitest / 25 files**, typecheck + lint clean.

- [x] **Login return-path regression fixed** (`LoginPage.tsx`): a welcome-page `useEffect` was pre-empting the return-path navigation (worst under StrictMode's double-mount in dev). Sign-out in `AppHeader.tsx` now `await`s `logout()` before `navigate('/login')` — navigating first bounced the user back off the protected login page.
- [x] **Integration tests now run inside `<StrictMode>`** (`renderApp.tsx`) so double-render regressions like the above are caught by the suite; added a sign-out integration test.
- [x] **MSW browser cookie emulation replaced with localStorage** (`src/tests/mocks/handlers.ts`): MSW v2's Service Worker cannot touch `Set-Cookie` (zero cookie code in the v2.15 worker bundle) — the httpOnly-cookie path never worked in the browser, so `/api/*` requests after login 401'd in dev/e2e. Browser mode (MODE !== 'test') now persists the session via localStorage; node test mode unchanged (`setActiveSession()`). Comment + `e2e/support/helpers.ts` updated.
- [x] **Rapid filter race fixed** (`UsersPage.tsx`): two `selectOption` changes in one tick clobbered each other. Root cause: react-router's `setSearchParams` **does not queue same-tick functional updates** (documented) and the previous merge used a stale closure. Fixed by serializing through a ref (`queryRef` synced in an effect) that same-tick updates build on.
- [x] **Axe critical fixed** (`ComponentsPage.tsx`): showcase `#theme-select` had no accessible name → `aria-label="Theme"`.
- [x] **E2E spec fixes:** `signIn()` lands on `/` (not `/users`) → a11y/users specs `goto('/users')` after signing in; the "creates a user" test used `grace.hopper@example.com` which collides with seeded Grace Hopper → now `kathleen.antonelli@example.com` (Kathleen Antonelli not in seed); `e2e/` added to `tsconfig.json` include so lint/typecheck cover the specs (also removed an unused import flagged by tsc).
- [x] `npm run typecheck` → 0 errors, `npm run lint` → 0 problems, `npm run test` → **223 tests / 25 files green**, `npx playwright test` → **16/16 green** (auth ×5, a11y ×3, users ×8).

**Root causes worth remembering (details in gotchas below):**
- StrictMode in dev was the reason the login redirect bug only showed in E2E — integration tests didn't use StrictMode until now.
- MSW v2 browser mode has **no cookie support** — any cookie-based auth flow must be emulated another way (here: localStorage).
- `setSearchParams` functional updates don't queue in the same tick → chain through a ref instead.
- E2E never ran green before: the old worker script (`mockServiceWorker.js` from an older MSW) had cookie emulation, so the localStorage store from a previous install may linger — harmless.

---

## Known decisions / gotchas (for resuming)

- **TypeScript 5.9.3**, NOT 7.x (typescript-eslint peer `typescript: <6.1.0`).
- **ESLint 9**, NOT 10 (eslint-plugin-jsx-a11y peer `^3–^9`).
- **react-router v8**: import from `react-router`; `RouterProvider` from `react-router/dom`. Requires Node ≥22.22, React ≥19.2.7. `react-router-dom` is removed in v8. `useNavigate()` returns `void | Promise<void>` → call sites use `void navigate(...)`.
- **MSW v2** requires the service worker file: `npx msw init public/ --save` (committed).
- Auth design: httpOnly-cookie sessions (JS never sees tokens); mock backend emulates the session in browser mode via **localStorage** (MSW v2's SW cannot touch `Set-Cookie` — see 5th-session gotchas) and falls back to `setActiveSession()` in node tests (undici fetch does not manage cookies); `refreshSession` single-flight; localStorage banned for tokens (ESLint rule bans direct localStorage access).
- MSW node tests: cookie header won't be present → handlers fall back to `activeSession` module state; tests call `setActiveSession('user-1')`; `resetMockServer()` runs in afterEach (setup.ts).
- react-router v8 route conventions: lazy pages via `lazy()`, `handle: { crumb }`, ProtectedRoute used as element wrapper (NOT layout route). **ProtectedRoute/SessionLoader/PermissionGate/RoleGate now live in `src/app/guards/guards.tsx`** (moved out of lib/auth — lib must not import components/ui). Import from `@/app/guards/guards`, not `@/lib/auth`.
- Styling: CSS Modules + tokens.css; dark mode via `[data-theme='dark']`; theme via ThemeProvider (`useTheme` from `@/app/providers/themeContext`).
- Coverage thresholds configured (70/70/70/60) — may need lowering if time-boxed.
- `eslint.config.js` boundary zones currently: components ← features/app, features ← other features (users/auth, `except: ['./users']` / `['./auth']`), lib ← features/components/hooks/app, hooks ← features/components/app, utils ← everything, services ← features/components/app.

### ESLint config gotchas (3rd session — CRITICAL, all verified)
- **Comment `*/` trap:** a JSDoc line containing `features/*/` closes the block comment early → cryptic `SyntaxError: Invalid or unexpected token` on the next line. Never put `*/` inside comments (write `features/<f>/`).
- **import-x v4 resolver:** `settings['import-x/resolver']` with `{ typescript: {...} }` is GONE. Use `'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true, project: './tsconfig.json' }), createNodeResolver()]` — `createNodeResolver` from `eslint-plugin-import-x`, `createTypeScriptImportResolver` from `eslint-import-resolver-typescript` (installed 3rd session).
- **no-restricted-paths zones:** only `target/from/except/message` (no `excludeFiles`). `except` is resolved **relative to `from`** and, for absolute `from`, must be a plain directory path (a `**` glob suffix breaks the `containsPath` check via `path.relative`).
- **prefer-nullish-coalescing:** configured `['error', { ignorePrimitives: true }]` — the codebase intentionally distinguishes falsy (`false || x`) from nullish. The rule otherwise fires on ALL nullable LHS including `boolean | undefined`.
- **react-hooks v7** adds `set-state-in-effect` and `set-state-in-render`: the React-sanctioned "adjust state during render" pattern (guarded `if (key !== last) setState(...)`) passes both; `useSyncExternalStore` is the cleanest escape hatch (useMediaQuery).
- **no-misused-promises on forms:** `handleSubmit(...)` is typed `(e) => Promise<void>` — passing it directly to `onSubmit` always flags. Wrap: `onSubmit={(e) => { void submitForm(e); }}`.
- **react-refresh/only-export-components:** split non-component exports into sibling files (`context.ts`, `useTheme.ts` style). Route tables (lazy() consts) get a file-level disable — fast refresh does not apply.
- **jsx-a11y caveats:** `label-has-associated-control` on presentational Label primitive → file disable (caller passes htmlFor); `role-supports-aria-props` on `aria-invalid` for radio → inline disable (aria-invalid is a global attribute); tablist wants `tabIndex={0}`.
- **logger.ts** is the only file allowed to touch console (targeted `eslint-disable-next-line no-console`); its internal method is named `write()` so `no-restricted-syntax` (`.log`) doesn't match.
- **eslint.config.js** is ignored by lint itself (`{ ignores: [... 'eslint.config.js'] }`) — the TS project service can't resolve it. `.agents/` also ignored.

### Test-writing gotchas (4th session — all verified against the live suite)
- **`getByText`/`getByLabelText` quirks:**
  - `getByText` matches against **direct text nodes only** (child elements are skipped). Text split by markup — `Delete <strong>Alan Turing</strong>?` — must be matched on the `<strong>` node itself (`getByText('Alan Turing')`), not with a regex spanning the split.
  - The required-field asterisk lives *inside* the `<label>` as an `aria-hidden` span, so the accessible name is `"Full name *"` and exact `getByLabelText('Full name')` fails → use regex matchers `/^Full name/`, `/^Email/`.
- **MSW scenario failure flags must be sticky** (`failListWith`, reset only in `resetScenario`): the HTTP client auto-retries 5xx (2 retries, ~0.3–0.8s backoff), so a one-shot `failNext*` flag is consumed by attempt 1 and the retry succeeds — the error state never surfaces. Error-state tests also need `{ timeout: 5000 }` on the initial `findByRole`.
- **Seed-data expectations:** `db.ts` preserves creation order (NOT alphabetical). Page 1 = users 1–10 (Ada, Alan, Grace, Edsger, Margaret, Tim, Barbara, Linus, Radia, Guido). Deleting user-2 shifts the array, so page 1 still shows 10 rows (Katherine Johnson moves in) — total drops to 24, not page-1 count.
- **Signed-in user's name renders in the header** (`Ada Lovelace` when session is user-1), so any name-based text assertion must be scoped to the table: `within(screen.getByRole('table'))` (or `await screen.findByRole('table')` first when the skeleton is showing — `within()` evaluates eagerly and throws if the table isn't mounted yet).
- **Invited users in the seed:** user-4 Edsger Dijkstra, user-9 Radia Perlman, user-14 Bjarne Stroustrup, user-19 Brendan Eich, user-24 Niklaus Wirth (5 total). Margaret Hamilton is **Disabled**, Tim Berners-Lee is on **page 1**.

### 5th-session gotchas (E2E + regressions — all verified)
- **StrictMode hides/creates bugs differently:** the login return-path bug was caused by a `useEffect` pre-empting navigation (double-mounted in dev StrictMode → raced). Integration tests now render inside `<StrictMode>` (`renderApp.tsx`) so these regressions can't slip past the suite again. Adding StrictMode is the first thing to try when a "works in prod, breaks in dev" bug appears.
- **MSW v2 browser mode has NO cookie emulation.** The installed worker bundle (`public/mockServiceWorker.js`) contains zero cookie code — `Set-Cookie` on mocked responses is ignored and cookies are never attached to requests. `credentials: 'include'` doesn't help. Any cookie-based auth mock must persist the session via localStorage (or a header) instead. (A stale `__msw-cookie-store__` localStorage entry from an older MSW worker may linger in dev — harmless, the current worker ignores it.)
- **`setSearchParams` functional updates do NOT queue.** Multiple `setSearchParams(fn)` calls in the same tick each see the state at dispatch time — the second call clobbers the first (documented in react-router docs). Chain same-tick updates through a ref, or drive state with `useState` and sync the URL in an effect.
- **Writing a ref during render is lint-blocked** (`react-hooks` "Cannot access refs during render") — sync the ref in an effect instead.
- **`navigate()` is `void | Promise<void>`:** inside an async function it must be `await navigate(...)` (no-floating-promises flags the non-await).
- **Playwright `selectOption` races under parallel workers:** two rapid `selectOption` calls on different filters can land in the same tick — always verify rapid-filter flows with the URL-merge fix above, and run the full suite (5+ workers) a few times to shake out timing flakes.
- **E2E test data must not collide with the seed:** `grace.hopper@example.com` collides with seeded Grace Hopper (emails are derived from names in `db.ts`). Pick names/emails absent from the 25-name `NAMES` list.
- **`signIn()` helper lands on `/`** (home, no returnPath) — specs that need another page must `goto()` after signing in.
- **`e2e/` must be in `tsconfig.json` include** or eslint's project service fails on every e2e file ("was not found by the project service") and tsc skips them.
