# Contributing

How to get set up and what happens to a change from idea to merge.

## 1. Getting started

```bash
npm install
npm run check          # typecheck + lint + test + build
npx playwright install chromium   # only needed for E2E
npm run dev            # mock backend on; demo accounts in src/tests/mocks/db.ts
```

If anything fails at `npm run check`, stop and fix it before writing new code — the repository is
kept green at all times.

## 2. Development workflow

1. Create a branch off `main`.
2. Implement the change with co-located tests.
3. Run `npm run check` locally.
4. If you touched UI primitives, confirm `npm run test` covers the new behavior **and** runs axe
   (`expectNoAxeViolations`).
5. If the change affects routing, auth, or the users feature, run the integration suite
   (`npm run test` covers it; E2E too if it's a user journey).
6. Push and open a PR.

Pre-commit (husky + lint-staged) auto-fixes formatting and lint on staged files. Configure the hook
once per clone with `npm run prepare`.

## 3. What a PR must contain

- The change, scoped: no drive-by refactors; unrelated cleanups go in their own PR.
- Tests for new behavior (and for fixed bugs — a failing test that now passes is the best
  description of a bug fix).
- No `any`, no global axe/ESLint disables, no unrecorded dependency bumps.
- If you changed a locked dependency or hit a tooling gotcha, update `PROGRESS.md`.
- If you changed a significant architectural choice, add or amend an ADR in `docs/adr/`.
- Update user-facing docs (`README.md`, `docs/*`) when behavior or commands change.

## 4. Commit conventions

- Conventional Commits style prefixes: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`,
  `perf:`, `ci:`.
- Imperative, lowercase subject, ≤ 72 chars: `fix: scope pagination when filters are active`.
- One logical change per commit.

## 5. Code review checklist

The reviewer verifies, for every PR:

- [ ] `npm run check` green on CI (typecheck, lint, 222+ tests, build).
- [ ] Architecture boundaries respected (no feature→feature or components→features imports).
- [ ] Accessibility: semantic markup, accessible names, keyboard operability, axe passed,
      announcements for async mutations.
- [ ] Security: no secrets in `VITE_*`, no `dangerouslySetInnerHTML`, URL guards used for
      user-controlled URLs, no storage of tokens.
- [ ] Server state goes through TanStack Query hooks; mutations invalidate; no raw `fetch` outside
      `lib/http`.
- [ ] Strings are user-facing-clean (no stack traces, no internals in UI).
- [ ] Tests actually assert behavior (not implementation details).

## 6. Adding a new feature

Copy the shape of `features/users/` — it is the reference feature:

1. `models/` — types + constants.
2. `schemas/` — Zod schemas (runtime validation + form schemas).
3. `api/` — endpoints through `httpClient`.
4. `services/` — pure business logic (labels, permissions, helpers).
5. `hooks/` — TanStack Query hooks with centralized query keys.
6. `components/` — feature UI; `pages/` — page composition.
7. Wire the route in `src/app/router/routes.tsx` (lazy), with guards and a breadcrumb.
8. Add MSW handlers for the new endpoints in `src/tests/mocks/handlers.ts` and register them with
   both the node server and the browser worker.
9. Tests: unit (services/schemas) + component + integration against MSW; `@a11y` E2E for the main
   page.

## 7. Gotchas worth re-reading before you start

- `docs/TESTING.md` §8 — five test-writing gotchas that will bite you (scoped queries, split text,
  sticky scenario flags, seed ordering, `within()` timing).
- `PROGRESS.md` — the full history of tooling constraints (ESLint/TS version locks, MSW v2,
  react-router v8 imports).
