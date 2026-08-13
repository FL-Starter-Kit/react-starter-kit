# Coding Standards

The rules that keep this repository consistent. Most are enforced automatically by `npm run lint` /
`npm run format` — the notes below explain the intent behind the machine rules and the rules that
are human-checked.

## 1. TypeScript

- Strict mode everywhere: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `verbatimModuleSyntax` (see `tsconfig.json`).
- `type` imports for types: `import type { User } from ...`.
- **No `any`.** Cast through `unknown`; zod-validate at trust boundaries. Exceptions require a
  documented justification in the PR.
- `as const`, branded types (`src/types/branded.ts`), and readonly arrays (`readonly User[]`) are
  used where they earn their keep.
- The project targets **TypeScript 5.9.x**, not 7.x (typescript-eslint peer constraint). Version
  changes must be recorded in `PROGRESS.md`.

## 2. React

- **Function components only.** No classes (except the one sanctioned class error boundary).
- Props are typed with interfaces (matching the established pattern) and extend
  `ComponentPropsWithoutRef<'element'>` when spreading native props; `children` is `ReactNode`.
- Hooks rules are enforced by `react-hooks` (v7, including the new `set-state-in-effect` /
  `set-state-in-render` rules):
  - Derive during render; **adjust state during render** with the guarded pattern when needed:
    ```tsx
    const targetKey = ...;
    const [lastKey, setLastKey] = useState('closed');
    if (targetKey !== lastKey) {
      setLastKey(targetKey);
      setServerError(null);
    }
    ```
  - Effects are for external systems (focus, subscriptions, `reset()` on RHF). Data flow belongs in
    render.
- Server state lives in TanStack Query hooks, never in component state; mutations invalidate their
  query keys.
- URL state (filters, pagination) lives in search params; the pre-login route travels as navigation
  state.
- Fast-refresh rules: non-component exports (contexts, hooks, route tables) live in sibling files,
  not in component files (`react-refresh/only-export-components`).
- Accessibility first (see `docs/ACCESSIBILITY.md`): native elements, accessible names, keyboard
  operability.

## 3. ESLint

Flat config in `eslint.config.js`. Beyond the defaults:

- **Architecture boundary zones** (`no-restricted-paths`): `components/` must not import
  `app`/`features`; features must not import other features; `lib/` must not import
  components/features/app. Violations are architecture bugs — fix them structurally, not with
  disables.
- **Import ordering** (`import-x/order`): external → alias → relative, enforced + auto-fixable via
  `npm run lint:fix`.
- **No console.log outside `lib/logging/logger.ts`** (the sanctioned gateway).
- **No direct `localStorage`/`sessionStorage` access** — use `safeStorage`.
- **`dangerouslySetInnerHTML` discouraged**; `javascript:` URLs and open redirects guarded in
  `utils/url.ts`.
- `prefer-nullish-coalescing` runs with `ignorePrimitives: true`: the codebase intentionally
  distinguishes `false || x` from `??` for booleans.
- Exhaustive switches over enums/union types (`switch-exhaustiveness-check`) — adding an error code
  requires handling it everywhere.
- Type-aware rules are on: `no-misused-promises` (async handlers must be `void`-wrapped),
  `no-floating-promises`.

## 4. Styling

- **CSS Modules + design tokens.** No inline styles for layout/colors; tokens from
  `src/styles/tokens.css` (or component CSS custom properties derived from them).
- **Semantic, not primitive.** Components reference _semantic_ tokens (`--color-surface`,
  `--color-text-primary`, `--color-action-primary`, `--color-border`), never primitives
  (`--blue-500`, `--gray-700`) and never raw values. Primitives are the raw palette in `tokens.css`;
  reach for a primitive only when deriving a new component-level variable, and add a semantic token
  when a role is reused across components.
- Class names are camelCase in modules; BEM is unnecessary.
- Components accept `className` and merge with `cn` (`src/utils/cn.ts`). Never reach into another
  component's CSS.
- Dark mode: colors come from tokens that flip under `[data-theme='dark']` — never hardcode colors.
- Respect `prefers-reduced-motion` and `prefers-contrast`.
- Keep components visually consistent: `Button`, `Dialog`, `FormField`, `Skeleton`, etc. — extend,
  don't fork.

## 5. Testing (summary — details in `docs/TESTING.md`)

- Co-locate tests next to the code they test (`Component.test.tsx`).
- Prefer role/label/text queries; scope assertions (`within(...)`); use `userEvent`.
- Every UI primitive gets an axe check.
- Keep the suite deterministic: no network, no real timers, MSW for all HTTP.
- 70/70/70/60 coverage thresholds are the floor, not the target.

## 6. Formatting

- Prettier (`npm run format`). Enforced by ESLint via the `prettier/prettier` rule, in CI via
  `format:check`, and in pre-commit via lint-staged.
- 2-space indent, single quotes, trailing commas, 100-char print width. Prettier options are defined
  in `eslint.config.js` (`prettierOptions`) and imported by `prettier.config.js`, so ESLint
  determines prettier's rules.

## 7. Naming

- Files: `PascalCase.tsx` for components, `camelCase.ts` for modules, `.test.tsx` for tests,
  `*Schemas.ts` for form schemas.
- Components: `useXxx` hooks, `XxxProps` interfaces, `XxxApi`/`XxxQueryKeys` layer objects.
- CSS Modules match their component: `Button.module.css`.
- States/actions in feature folders: `models/`, `schemas/`, `api/`, `utils/`, `hooks/`,
  `components/`, `pages/`.

## 8. Comments

- Explain **why**, not what. JSDoc for public module APIs (component contracts, lib functions).
- **Never** `features/*/`-style globs inside JSDoc — `*/` inside a block comment terminates it early
  and breaks ESLint with a cryptic error (write `features/<f>/` instead).
- No leftover `TODO`s in code being merged; track them in `PROGRESS.md`.

## 9. Version pinning

The stack table in `PROGRESS.md` is the source of truth for locked versions and the reasons
(peer-dependency constraints, verified compatibility). When upgrading:

1. Update `package.json` + `package-lock.json`.
2. Run `npm run check` (typecheck + lint + test + build) plus `test:e2e`.
3. Record the change and any gotchas in `PROGRESS.md`.
