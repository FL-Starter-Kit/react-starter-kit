# Testing

How this repository tests, and the conventions every test follows.

## 1. The pyramid

| Layer       | Tooling                        | Location                        | Coverage intent                                                                          |
| ----------- | ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------- |
| Unit        | Vitest + jsdom                 | `src/**/*.test.ts`, co-located  | Pure logic: utils, permissions, HTTP error normalization, retry/backoff, session refresh |
| Component   | Vitest + Testing Library       | `src/**/*.test.tsx`, co-located | UI primitives: rendering, keyboard interaction, states, axe checks                       |
| Integration | Vitest + Testing Library + MSW | `src/features/**/*.test.tsx`    | Full app against the mocked backend: users feature, login, guards, refresh               |
| E2E         | Playwright                     | `e2e/`                          | Auth journey, users CRUD, `@a11y` axe scans against the dev server                       |

Commands: `npm run test` (Vitest), `npm run test:coverage` (thresholds 70/70/70/60 in
`vite.config.ts`), `npm run test:e2e`, `npm run test:a11y` (Playwright tests tagged `@a11y`).

## 2. Infrastructure

- **`src/tests/setup.ts`** — runs before every Vitest test: jest-dom matchers, MSW node server
  lifecycle (start before all, reset after each, close after all), scenario/db reset.
- **`src/tests/render.tsx`** — `renderWithProviders(ui, { initialEntries })`: isolated QueryClient
  (**retries disabled, `staleTime: Infinity`**) + in-memory router. Component tests use this.
- **`src/tests/renderApp.tsx`** — `renderApp({ initialEntries, sessionUserId })`: the **real app**
  (ThemeProvider + QueryClient + AuthProvider + the actual route table) and waits for lazy routes to
  settle. Integration tests use this. Call `setActiveSession('user-1')` for authenticated scenarios.
- **`src/tests/a11y.ts`** — `expectNoAxeViolations(element)` / `renderAndCheckA11y(ui)` using
  axe-core directly (no jest-axe wrapper).
- **`src/tests/mocks/`** — core MSW plumbing: session store (`session.ts`), session-lifecycle
  scenario knobs (`scenario.ts`), and the browser/node bootstrap that composes the example handlers.
  The demo handlers and seed data live with their examples: `examples/users-crud/mocks/` (users
  CRUD, 25 seeded users, `usersScenario` knobs: `listDelayMs`, sticky `failListWith`) and
  `examples/auth/mocks/` (login/me/refresh/logout, demo accounts, session knobs:
  `expireNextRequest`, `failNextRefresh`, `rejectLogin`).

## 3. MSW conventions

- Tests are driven through the **same HTTP stack as production**: component code calls the API, MSW
  intercepts `fetch`.
- `scenario` flags are **sticky until reset** (`afterEach` in setup). A one-shot failure flag would
  be consumed by the HTTP client's first attempt and the automatic retry would succeed — the error
  state would never render.
- The HTTP client retries 5xx with backoff (~0.3–0.8s). Error-state tests need a generous timeout on
  the first assertion (e.g. `{ timeout: 5000 }`).
- Cookies are not managed by undici in Node, so handlers fall back to `setActiveSession(...)` module
  state for authentication.

## 4. Testing Library conventions

- **Query from the user's perspective**: `getByRole`/`getByLabelText`/`getByText` first; only fall
  back to testids when no semantic role exists.
- **Scope to what you assert.** The signed-in user's name renders in the app header, so a name like
  `Ada Lovelace` appears twice when signed in as user-1. Text assertions about list rows must be
  scoped: `within(screen.getByRole('table'))`. When the table may not be mounted yet (loading
  skeleton), resolve the table first:
  `const table = await screen.findByRole('table', undefined, { timeout: 3000 })` — `within()`
  evaluates eagerly and throws if the element is absent.
- **Prefer `findBy*` for anything async**; use `waitFor` for conditions that change outside a single
  event.
- **`getByText` matches direct text nodes only.** Text split by markup
  (`Delete <strong>Alan Turing</strong>?`) cannot be matched with a regex spanning the split — match
  the leaf node (`getByText('Alan Turing')`) or assert on the accessible name instead.
- **Required-form labels**: the required marker is an `aria-hidden` span _inside_ the label, so the
  accessible name is `"Full name *"`. Exact `getByLabelText('Full name')` fails; use a prefix regex:
  `getByLabelText(/^Full name/)`.
- Use `userEvent` (not `fireEvent`) for interactions — it fires realistic event sequences.
- A single `userEvent.setup()` per test; await every interaction.

## 5. Accessibility checks

- Every UI primitive test ends with `expectNoAxeViolations(...)` (or `renderAndCheckA11y`).
- E2E `@a11y` tests run axe scans over full pages (login, users, components showcase).
- axe flags are **only** suppressed with an inline comment explaining why; never globally.

## 6. Fixtures and seed data

- 25 seeded users in `examples/users-crud/mocks/db.ts`, **in creation order, not alphabetical**.
  Page 1 = users 1–10 (Ada Lovelace … Guido van Rossum); page 2 = users 11–20 (Katherine Johnson …
  Donald Knuth); page 3 = users 21–25 (Mary Wilkes … Sophie Wilson).
- Role cycle: Admin, Editor, Viewer, Viewer, Editor (repeat). Status cycle: Active, Active, Active,
  Invited, Disabled (repeat).
- Invited users: Edsger Dijkstra (user-4), Radia Perlman (user-9), Bjarne Stroustrup (user-14),
  Brendan Eich (user-19), Niklaus Wirth (user-24).
- Deleting a user shifts the array: removing user-2 leaves page 1 with 10 rows (Katherine Johnson
  moves in from page 2) — total count drops, not the page-1 count.
- Demo login accounts: `admin@example.com` / `admin123`, `editor@example.com` / `editor123`,
  `viewer@example.com` / `viewer123`. The signed-in user (user-1) cannot be deleted by the UI.

## 7. Determinism

- QueryClient in tests: `retry: false`, `staleTime: Infinity`, `gcTime: Infinity` — no retries, no
  background refetch surprises.
- MSW delay knob (`scenario.users.listDelayMs`) drives the loading-skeleton test.
- Time travel: avoid fake timers unless testing debounce; the search filter test relies on the real
  debounce, so keep timeouts explicit there.

## 8. Gotchas (all learned the hard way)

Keep `PROGRESS.md` up to date when you hit a new one. Current list:

1. `getByText` and split text nodes (see §4).
2. Required-marker asterisk in the label's accessible name (see §4).
3. Sticky scenario flags (see §3).
4. Seed ordering and delete-shift semantics (see §6).
5. `within()` evaluates eagerly — resolve the container with `findByRole` when it may not exist yet.
6. Header duplicates signed-in user names — always scope row assertions to the table.
