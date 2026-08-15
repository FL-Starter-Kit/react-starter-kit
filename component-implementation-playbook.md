# UI Component Implementation Playbook

Fast-track guide for implementing the remaining enterprise UI primitives in this starter kit
(Combobox, FileUpload, DataTable). Distilled from the Toast/Notification implementation — read this
before starting a component to avoid re-discovering the repo's conventions.

**Rule: implement exactly ONE component at a time. After each one, validate, update
`react-starter-kit-issues.md`, then STOP and wait for confirmation.**

---

## 1. Repo facts to rely on

- **Stack:** React 19 + TypeScript (strict) + Vite 8 + Vitest (jsdom) + Testing Library + axe-core +
  ESLint 9 + CSS Modules. Routing = `react-router` v8. Server state = TanStack Query. No CSS
  framework, no `clsx`.
- **Radix:** none was installed initially. Decision (confirmed): **use Radix for the complex
  primitives** (`@radix-ui/react-*`), wrapped in the repo's CSS-module + token styling. Install per
  component: `npm install @radix-ui/react-<primitive>`.
- **Import alias:** `@/` → `src/`. Utilities: `cn()` at `@/utils/cn`.
- **Design tokens:** `src/styles/tokens.css` — semantic tokens only (e.g. `--color-action-danger`,
  `--color-status-*`, `--z-dialog: 400`, `--z-toast: 500`, `--transition-base: 200ms`, `--radius-*`,
  `--shadow-*`). Never hard-code values.
- **Reusable pieces to reuse, not duplicate:**
  - `Button` (`@/components/ui/Button`) — variants `primary/secondary/danger/ghost`, `loading`,
    `fullWidth`.
  - `IconButton`, `Spinner`, `Skeleton`, `Badge`.
  - `FormField` (`@/components/ui/FormField`) — label + error + hint wiring.
  - `Pagination` (`@/components/ui/Pagination`) — for the DataTable.
  - `Popover` (`@/components/ui/Popover`) — composable `Popover`/`PopoverTrigger`/`PopoverContent`
    (Radix); the Combobox/command palette build on it.
  - `Alert` (`@/components/feedback/Alert`) — variant styling reference.
  - `announce(message, 'polite'|'assertive')` from `@/lib/accessibility/liveRegion`.
  - `Dialog` (`@/components/ui/Dialog`) — the single modal primitive (Radix, `role="dialog"` or
    `role="alertdialog"`). Confirmation mode via `onConfirm` (`role="alertdialog"`, forces an
    explicit choice, no outside-click close); generic mode otherwise (`role="dialog"`). The former
    native-`<dialog>` `Dialog` and `ConfirmDialog` were merged into it; do not reintroduce them.
- **Test helpers:**
  - `@/tests/a11y`: `renderAndCheckA11y(ui, options)` and `expectNoAxeViolations(options)`. Existing
    scans disable `color-contrast` (`const axeOptions = { disabledRules: ['color-contrast'] }`).
  - `@/tests/render`: `renderWithProviders` (QueryClient + memory router) — needed only if a
    component uses routing hooks.
- **App wiring:** app-wide providers mount in `src/app/bootstrap/bootstrap.tsx`. Live component docs
  live in `examples/showcase/pages/ComponentsPage.tsx` — add a demo section there.

## 2. Conventions that will bite you

### TypeScript (strict + `exactOptionalPropertyTypes`)

- Never pass `undefined` to an optional prop. Build optional Radix props conditionally:
  ```tsx
  <RadixToast.Provider
    label="Notification"
    {...(defaultDuration !== undefined && { duration: defaultDuration })}
  />
  ```
- `noUncheckedIndexedAccess`: array indexing returns `T | undefined`. `!` is FORBIDDEN
  (`@typescript-eslint/no-non-null-assertion`), and `as Element` on a `T | null` is ALSO flagged
  (prefer `!`). Escape hatch: narrow with a guard (`if (x !== null) {...}`), use
  `expect(x).toBeInstanceOf(Element)` for tests.
- `noUnusedLocals` / `noUnusedParameters` on. Remove unused imports immediately.

### ESLint

- `import-x/order`: external group alphabetical (`@radix-ui/*` before `react`), blank line, internal
  `@/**`, blank line, sibling `./...` alphabetical with the CSS module LAST, no blank lines inside a
  group. Run `eslint --fix` on the folder; it fixes ordering + void-expression braces.
- `no-confusing-void-expression`: arrow shorthand that returns `void` is an error — use braces
  (`dismiss: (id) => { dismissToast(id); }`).
- `require-await`: async functions must actually `await` something.
- `no-empty-function`: no empty arrow bodies.
- `consistent-type-imports` inline style: `import { useEffect, type AnimationEvent } from 'react'`.
- `no-floating-promises`, `no-misused-promises`: async handlers handled properly.
- `react-refresh/only-export-components` is only a warning.

### CSS Modules

- Tests use `classNameStrategy: 'non-scoped'`, so class names keep their source names in jsdom.
  Keyframe names ARE still hashed by Vite — never compare `event.animationName` against a literal;
  check `data-state` / a custom attribute instead.
- Media queries cannot use CSS custom properties (`@media (min-width: var(--bp-sm))` is invalid) —
  use the literal pixel value.
- Reduced motion: gate animations behind `@media (prefers-reduced-motion: no-preference)`, or rely
  on the global reduced-motion rule in `base.css`.

### Tests / jsdom reality

- **jsdom does not run CSS animations** → `animationend` never fires.
- **jsdom rAF callbacks never fire** in this setup → Radix's live-region text (gated behind
  `useNextFrame`) is empty; assert announcement _attributes_ (`aria-live`), not announcer text
  content.
- **Fake timers + RTL `findBy*` do not mix** (`waitFor` uses real timers). Pattern: wrap the action
  in `act`, then assert synchronously with `getBy*`:
  ```tsx
  async function addToast(create: () => void): Promise<void> {
    act(() => {
      create();
    });
    await Promise.resolve();
  }
  ```
- Always `vi.useRealTimers()` in a `finally` block.
- `setup.ts` polyfills `<dialog>` and `matchMedia` — other browser APIs are NOT polyfilled.

## 3. Standard workflow (per component)

1. Read this playbook + skim an existing implementation of the same shape (Toast for store-driven,
   Dialog/Button for styling).
2. Install the Radix package(s) needed (`npm install @radix-ui/react-<primitive>`).
3. Implement under `src/components/<area>/<name>/` (component + `*.module.css` + tests +
   `index.ts`), add exports to the parent `index.ts`, wire into `bootstrap.tsx` if app-wide, add a
   showcase demo section.
4. Tests: unit tests co-located (`<name>.test.tsx`) + an axe scan in `src/components/a11y.test.tsx`.
5. Validate: `npm run check` (typecheck → lint → tests → build), then
   `npx playwright test e2e/a11y.spec.ts` (real-browser axe scans).
6. Update `react-starter-kit-issues.md` (mark the numbered issue + add an entry under "# Implemented
   Components").
7. Report in the fixed format and STOP.

## 4. Cross-cutting recipes

### Module store + imperative API (Toast, and any "call from anywhere" surface)

- Module-level immutable array + `Set` of listeners + `emit()`.
- Expose via `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` in a provider;
  provider maps snapshot to Radix items.
- Return ids from the imperative API for programmatic dismissal.
- Export an explicit `clear()` for test isolation; call it in `beforeEach`/`afterEach`.
- Guard callbacks so they fire exactly once per state transition (see Toast `onDismiss`).

### Controlled Radix `open` + graceful exit

- Drive `open` from your store; handle `onOpenChange(false)` → transition to a `leaving` state (keep
  the item mounted, `open=false`).
- Remove the item when its `data-state` flips to `"closed"` via `onAnimationEnd` (check
  `event.target === event.currentTarget && dataset.state === 'closed'`), with a `setTimeout`
  fallback (e.g. 600ms) for environments where the animation never fires. `removeToast` must be
  idempotent.

### Live-region announcements

- For React-controlled content use Radix (Toast does this internally). For everything else use
  `announce()` from `@/lib/accessibility/liveRegion`. Announce meaningful state changes, not every
  keystroke.

### Async loading without race conditions (Combobox)

- Track the latest request (ref of an incrementing counter or the request itself); ignore stale
  resolutions: `if (requestId !== latestRef.current) return;`.
- Handle: loading → data/empty → error; keep the input value independent of the option list; clear
  only valid selections.

## 5. Per-component recipes

### Dialog — the merged modal primitive — `@radix-ui/react-dialog` + `@radix-ui/react-alert-dialog`

- Single controlled component (`open` / `onOpenChange`) rendering **either** Radix Dialog
  (`role="dialog"`, generic mode: closes on outside click) **or** Radix AlertDialog
  (`role="alertdialog"`, confirm mode: forces a decision, no outside-click close). Mode defaults
  from `onConfirm` presence; explicit `variant?: 'confirm' | 'generic'` overrides it.
- The two Radix roots share one content body (header/✕ close, description, body, footer). Footer
  resolution: custom `footer` > built-in confirm/cancel (when `onConfirm` set) > single "Close"
  fallback (`Dialog.Close` / `AlertDialog.Cancel`). `size: 'sm' | 'md' | 'lg'`.
- Destructive styling: reuse `Button variant="danger"`. Loading: `Button loading` + `disabled` on
  confirm AND cancel while submitting; guard against double submit (a `submitting` state checked
  before invoking the async action).
- Async confirm: the consumer supplies `onConfirm: () => Promise<void>`; catch errors and surface
  via an inline error (`Alert variant="danger"`) — do NOT close on failure.
- Focus restore: Radix restores to its own `Trigger`, which doesn't exist here (controlled). Capture
  `document.activeElement` in `onOpenAutoFocus` and restore it in `onCloseAutoFocus`
  (`event.preventDefault()`). Radix handles Escape/scroll-lock/`aria-describedby`.
- Tests: open/close, Escape, outside-click (confirm: stays open; generic: closes — outside-pointer
  listeners are deferred to a `setTimeout(0)` + follow-up `click` in jsdom), focus
  trapping/restore, async confirm (loading disables buttons, no double submit), error state, role
  assertions (`dialog` vs `alertdialog`), axe scan.

### Popover — `@radix-ui/react-popover`

- `Popover.Root` (uncontrolled default or controlled `open`/`onOpenChange`), `Popover.Trigger`,
  `Popover.Portal` + `Popover.Content` (`side`, `align`, `sideOffset`), `Popover.Arrow`.
- Radix handles collision detection, viewport boundaries, portal, focus management, Escape and
  outside-click dismissal. Don't re-implement.
- Add `z-index` above overlays (use `--z-drawer`/`--z-dialog` range) and a subtle entrance animation
  gated on reduced-motion.
- Composability: expose the pieces (`PopoverContent` etc.) so future date pickers / comboboxes /
  menus build on top.
- Tests: open/close, Escape, outside click, controlled usage, focus moves into content, axe scan.

### Combobox / Autocomplete — `@radix-ui/react-popover` + custom ARIA

- Radix has NO combobox primitive; build on `Popover` + a `role="combobox"` input and
  `role="listbox"` / `role="option"` list (WAI-ARIA combobox pattern).
- Keyboard: ArrowUp/Down move the active option (use `aria-activedescendant` pointing at the option
  id), Enter selects, Escape closes, Home/End jump, Tab commits/blurs.
- Support single + multi (checkboxes/tags) and `disabled` options; clear button.
- Async options via a race-condition-safe loader (recipe above); loading spinner in the list;
  explicit empty state; error state.
- Keep list rendering cheap for large datasets (memoize filtered options; virtualize only if
  actually needed — the repo has no virtualization dep).
- Tests: keyboard nav, select, multi-select, clear, disabled options, async load, empty state, axe
  scan.

### FileUpload — no Radix; native `input[type=file]` + `announce()`

- Separate concerns per the spec: (1) selection/validation, (2) upload lifecycle/state, (3)
  presentation. Consumer supplies the upload function (`(file, callbacks) => Promise<void>` style) —
  never hard-code a backend.
- Native file input (visually hidden + labelled button) for picker + a drop zone that also forwards
  drag events to the input; ENTER/SPACE on the zone triggers the picker.
- Validate type (accept) + size; keep rejected files with error messages; dedupe.
- Progress: report via `onProgress`; cancel via `AbortController` the consumer passes / an abort
  function; retry keeps the file in state and re-invokes the uploader.
- Announce status changes with `announce()` (e.g. "Uploading…", "Failed: too large").
- Tests: selection, validation (type/size), drag & drop, progress, error, cancel, retry, remove, axe
  scan.

### DataTable — custom headless table (no Radix, no extra deps)

- Reuse the existing `Pagination` component. Native `<table>` + `<caption>` + `<th scope>` semantics
  per `docs/ACCESSIBILITY.md`.
- Strongly typed `Column<T>` definitions (key, header, accessor/render, sortable, visible-toggle,
  width). `Data<T>` with a stable `id`.
- Controlled state: `page`, `pageSize`, `sort`, `filters`, `selectedRowIds`, `columnVisibility` —
  managed by the consumer (server-side data is owned by the consumer; the table is presentational).
- URL state: read/write search params but stay router-agnostic — accept `params` + `onParamsChange`
  or a small adapter; do not import `react-router` into the component.
- Loading (Skeleton rows or `aria-busy`), empty (`EmptyState`), error (`ErrorState`) states with
  `role="status"`/`role="alert"` announcements.
- Selection: header checkbox with tri-state (`aria-checked="mixed"`), bulk action bar. Sorting
  buttons with `aria-sort` on `<th>`.
- Keyboard: native table tab order + sorting/selection via buttons/checkboxes.
- Virtualization: NOT required by default — only add if profiling proves large lists (repo has no
  virtualization dependency; don't add one unnecessarily).
- Tests: sorting, pagination, filtering, column visibility, selection, bulk actions,
  loading/empty/error, keyboard, URL state, axe scan.

## 6. Validation & reporting

```bash
npm run check                          # typecheck + lint + tests + build
npx playwright test e2e/a11y.spec.ts   # real-browser axe scans (login, users, showcase)
```

- `npm run check` must exit 0. `generate.test.ts` occasionally times out (pre-existing flake) —
  re-run to confirm before blaming your change.
- Only modify files related to the component in progress. Preserve any pre-existing staged changes
  in `react-starter-kit-issues.md`.
- Report exactly:

```text
Component: <name>
Status: Complete / Blocked

Files:
- ...

Validation:
- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Tests: PASS/FAIL
- Build: PASS/FAIL

Issues updated: Yes/No

Waiting for confirmation to continue.
```

## 7. Pitfall cheatsheet

| Trap                                          | Fix                                                  |
| --------------------------------------------- | ---------------------------------------------------- |
| Passing `undefined` to an optional Radix prop | Conditional spread `{...(x !== undefined && { x })}` |
| `!` / `as X` on nullable values               | Guard with `if (x !== null)` / assert in tests       |
| Arrow returning `void`                        | Add braces `() => { fn(); }`                         |
| `findBy*` with fake timers hangs              | `act(() => { ... })` + synchronous `getBy*`          |
| `animationend` never fires (jsdom)            | `setTimeout` fallback for removal                    |
| rAF never fires (jsdom)                       | Assert live-region attributes, not text              |
| CSS `@media (min-width: var(--x))`            | Use the literal pixel value                          |
| Keyframe name comparison                      | Compare `data-state`/custom attr instead             |
| Module-store state leaking between tests      | `clear()` in `beforeEach`/`afterEach`                |
| Import order errors                           | `npx eslint <folder> --fix`                          |
