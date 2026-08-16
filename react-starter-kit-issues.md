# React Starter Kit — Issues & Improvements

## Overview

This document consolidates the issues, risks, and recommended improvements identified during the
review of the React starter kit.

### Priority legend

- **P0 — Fix before using as the master starter**
- **P1 — Fix/add before serious client projects**
- **P2 — Valuable enhancement**
- **P3 — Optional / future**

---

# P1 — Fix/Add Before Serious Client Projects

## 12. Add a reusable enterprise DataTable — ✅ Implemented

This is probably the highest-value missing UI primitive.

### Recommended capabilities

```text
sorting
server-side pagination
server-side filtering
column visibility
row selection
bulk actions
loading state
empty state
error state
responsive behavior
keyboard navigation
URL state
```

Delivered by `src/components/ui/DataTable` (see "Implemented components" below). A custom headless
table (no new dependencies) built on the existing `Pagination` and `Popover` primitives. Filtering
is owned by the consumer (server-side data is filtered before it reaches the table).

**Priority:** P1

---

## 13. Add a Toast/Notification system — ✅ Implemented

A reusable notification system is needed across almost every client application.

Recommended capabilities (all delivered by `src/components/feedback/toast`):

```text
success
info
warning
error
dismiss
auto-dismiss
action button
stacking
accessibility announcements
```

Built on `@radix-ui/react-toast` (see "Implemented components" below).

**Priority:** P1

---

## 14. Add a standardized modal/confirmation component — ✅ Implemented

Dangerous operations should use a standardized confirmation component.

Examples:

```text
Delete user
Remove organization member
Cancel subscription
Discard changes
```

The component should support:

- focus management
- Escape
- focus restoration
- destructive styling
- loading state
- async confirmation

Delivered by `src/components/ui/Dialog` (see "Implemented components" below). During delivery it
absorbed the native-`<dialog>` `Dialog` and became the single modal primitive: a confirmation
`role="alertdialog"` mode and a generic `role="dialog"` mode.

**Priority:** P1

---

## 15. Add a proper Popover primitive — ✅ Implemented

A reusable Popover should provide:

- positioning
- collision detection
- viewport boundary handling
- focus management
- portal support
- keyboard dismissal
- anchor alignment

This can also support:

```text
date picker
filters
combobox
command palette
contextual actions
```

Delivered by `src/components/ui/Popover` (see "Implemented components" below). Built on
`@radix-ui/react-popover`; the composable pieces (`PopoverTrigger`, `PopoverContent`, …) are the
foundation the Combobox and Command palette build on.

**Priority:** P1

---

## 16. Add Combobox/Autocomplete — ✅ Implemented

This is a common enterprise UI requirement.

It should support:

```text
keyboard navigation
typeahead
async loading
empty state
disabled options
multi-select
clear
loading
ARIA semantics
```

**Priority:** P1

Delivered by `src/components/ui/Combobox` — a WAI-ARIA combobox (a `role="combobox"` input wired to
a `role="listbox"` via `aria-activedescendant`) built on the Popover primitive. Supports ↑ ↓ Home
End Enter Escape navigation, client-side typeahead filtering, a debounced and race-safe async option
loader with loading/error/empty states, disabled options, single or multi selection (with removable
tags), a clear button, and external validation errors.

---

## 17. Add FileUpload — ✅ Implemented

A reusable enterprise file-upload primitive would be highly valuable.

Consider:

```text
drag & drop
file picker
file type validation
size validation
multiple files
progress
cancel
retry
server errors
preview
accessibility
```

**Priority:** P1

Delivered by `src/components/ui/FileUpload` — a native `input[type="file"]`-based uploader with a
drop zone, keyboard-accessible file picker, per-file upload status
(`pending`/`uploading`/`done`/`error`), drag & drop, file type + max-size validation (MIME,
MIME-wildcard, and extension `accept` tokens), single- or multi-file modes, progress reporting,
cancel (via `AbortController`), retry, and remove. Consumers provide
`onUpload(file, { onProgress, signal })`; status transitions are announced through the live region.
Rejected files are listed with actionable error messages.

---

## 18. Add dependency update automation

Use:

- Dependabot, or
- Renovate

Recommended targets:

```text
React
React Router
Vite
TypeScript
TanStack Query
Playwright
ESLint
Zod
```

Use controlled update groups rather than blindly updating everything.

**Priority:** P1

---

## 19. Align Node version requirements

The package configuration and CI should communicate the same supported Node version policy.

Avoid unnecessarily tying the starter to a specific Node patch version unless required.

Recommended approach:

```text
Supported Node major versions
+
.nvmrc
+
CI matrix or single supported version
+
package.json engines
```

**Priority:** P1

---

# P2 — Valuable Enhancements

## 24. Add complex workflow/state-machine guidance

Do not add a state-machine library by default.

Instead document when to use one.

For workflows like:

```text
Draft
 ↓
Submitting
 ↓
Processing
 ↓
Completed
```

avoid many independent booleans.

Use a state machine only when the workflow actually warrants it.

**Priority:** P2

---

## 25. Add CODEOWNERS / ownership conventions

Useful when the project grows beyond a single developer.

Suggested ownership boundaries:

```text
components/
lib/
features/
tests/
```

**Priority:** P2

---

## 26. Add project profiles

Create documented project presets rather than multiple codebases.

Examples:

```text
SaaS
Admin
Dashboard
E-commerce
Marketing
```

Example SaaS profile:

```text
auth
organizations
roles
billing
settings
```

Example Admin profile:

```text
auth
users
roles
permissions
tables
filters
audit
```

**Priority:** P2

---

## 27. Add an AI development contract

Since the repository is intended for AI-assisted development, add:

```text
AGENTS.md
AI_RULES.md
```

Document:

```text
architecture rules
dependency rules
React conventions
accessibility requirements
testing requirements
security requirements
API conventions
naming conventions
```

This gives every AI coding agent the same project contract.

**Priority:** P2

---

## 28. Add OpenAPI integration/code generation

For API-heavy freelance projects, consider supporting:

```text
OpenAPI
 ↓
generated types
 ↓
generated API client
 ↓
TanStack Query integration
```

This can eliminate repetitive manual API typing.

**Priority:** P2

---

## 29. Consider Storybook only if the component library grows

Storybook is useful for:

- component development
- visual review
- accessibility checks
- documentation
- client handoff

But it should not be mandatory for every small freelance project.

**Priority:** P2

---

## 30. Consider visual regression testing later

Once the UI system becomes stable, consider:

```text
Playwright screenshots
or
Chromatic / similar tooling
```

This is particularly useful for shared UI components.

**Priority:** P2

---

# P3 — Optional / Future

## 31. Internationalization

Do not add i18n libraries by default.

But ensure the architecture does not make localization difficult.

Consider later:

```text
i18next
FormatJS
native Intl APIs
```

**Priority:** P3

---

## 32. PWA/offline support

Only introduce this for projects that actually require:

- offline operation
- installability
- background synchronization
- caching strategies

**Priority:** P3

---

## 33. Advanced performance instrumentation

Eventually consider:

```text
Web Vitals
React performance profiling
route timing
API timing
bundle analysis
long-task detection
```

This is useful for mature client applications but not required in the base starter.

**Priority:** P3

---

# Architectural Principles to Preserve

These are strengths of the existing starter and should remain part of the foundation.

## Server state

```text
TanStack Query
```

Do not move API state into Redux/Zustand without a concrete requirement.

## URL state

```text
Router/Search Params
```

Use URL state for:

```text
filters
search
pagination
sorting
selected views
```

## Local UI state

```text
useState
useReducer
```

## Global UI state

```text
Context — sparingly
```

## Complex workflow state

```text
State machine — only when justified
```

## API boundary

Keep:

```text
HTTP client
    ↓
API module
    ↓
runtime validation
    ↓
feature hooks
    ↓
components
```

## Accessibility

Prefer:

```text
native HTML
    ↓
semantic HTML
    ↓
ARIA
    ↓
custom interaction only when necessary
```

## Architecture enforcement

Continue using ESLint/import boundaries to enforce architectural rules rather than relying only on
documentation.

---

# Recommended Target Architecture

```text
src/
│
├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── layouts/
│   ├── providers/
│   ├── router/
│   └── errors/
│
├── components/
│   ├── ui/
│   ├── feedback/
│   ├── layout/
│   └── navigation/
│
├── features/
│   ├── auth/
│   ├── users/
│   └── ...
│
├── lib/
│   ├── auth/
│   ├── http/
│   ├── logging/
│   ├── telemetry/
│   ├── storage/
│   └── accessibility/
│
├── hooks/
│
├── styles/
│   ├── tokens.css
│   └── base.css
│
├── tests/
│   ├── mocks/
│   ├── render.tsx
│   └── setup.ts
│
├── types/
│
└── utils/
```

Recommended dependency direction:

```text
                    APP
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      FEATURES             COMPONENTS
          │                     │
          └──────────┬──────────┘
                     ↓
                    LIB
                     ↓
                   UTILS
```

State ownership:

```text
SERVER STATE  → TanStack Query

URL STATE     → Router/Search Params

LOCAL UI      → useState/useReducer

GLOBAL UI     → Context

COMPLEX FLOW  → State Machine when justified
```

---

# Final Priority Summary

## Next most valuable

- [x] Enterprise DataTable
- [x] Toast/notification system
- [x] Dialog (modal/confirmation primitive)
- [x] Popover
- [x] Combobox/Autocomplete
- [x] FileUpload
- [ ] Dependency automation
- [ ] Align Node version requirements

## Longer-term

- [ ] State-machine guidance
- [ ] CODEOWNERS
- [ ] Project profiles
- [ ] AGENTS.md / AI_RULES.md
- [ ] OpenAPI integration
- [ ] Storybook
- [ ] Visual regression
- [ ] i18n
- [ ] PWA/offline support
- [ ] Advanced performance instrumentation

---

# Implemented Components

## 1. Toast / Notification system — ✅ Complete

**Component:** `ToastProvider` + imperative `toast` API (`src/components/feedback/toast`)

**Files added**

- `src/components/feedback/toast/types.ts` — `ToastVariant`, `ToastAction`, `ToastOptions`,
  `ToastData`, `ToastInput`
- `src/components/feedback/toast/store.ts` — module-level store +
  `toast.success/info/warning/error/dismiss/dismissAll/clear`
- `src/components/feedback/toast/ToastProvider.tsx` — app-wide provider (`useSyncExternalStore` +
  Radix `Toast.Provider`)
- `src/components/feedback/toast/ToastItem.tsx` — single toast (Radix `Toast.Root`),
  exit-animation-aware removal
- `src/components/feedback/toast/ToastIcon.tsx` — inline SVG variant icons
- `src/components/feedback/toast/Toast.module.css` — tokens-based styles, responsive positioning
- `src/components/feedback/toast/index.ts` — public exports
- `src/components/feedback/toast/toast.test.tsx` — 16 unit tests

**Files modified**

- `src/components/feedback/index.ts` — exports the toast system
- `src/app/bootstrap/bootstrap.tsx` — mounts `<ToastProvider />` at the app root
- `src/components/a11y.test.tsx` — axe scan for an active toast
- `examples/showcase/pages/ComponentsPage.tsx` — live Toast demo section
- `package.json` / `package-lock.json` — added `@radix-ui/react-toast`

**Dependencies**

- `@radix-ui/react-toast` (first Radix primitive in the repo, per the decision to use Radix for the
  complex components in this task). Everything else (pausable timers, live-region announcements,
  swipe, focus management) comes from Radix.

**Important design decisions**

- Imperative module-level API (`toast.success(...)`) backed by an immutable snapshot + subscriber
  store consumed by the provider via `useSyncExternalStore` — callable from anywhere (event
  handlers, async flows, error boundaries) with no context wiring, and calls before the provider
  mounts are still shown.
- Per-variant auto-dismiss defaults (error lingers longest); `duration: Infinity` keeps a toast
  until dismissed.
- Variant-to-politeness mapping: `error` uses Radix's `foreground` type (assertive live region), the
  rest use `background` (polite).
- Dismissal is two-phase (`active` → `leaving`): the item stays mounted with `open=false` so the
  exit animation plays, then is removed via `animationend` (checking `data-state="closed"`) with a
  600ms `setTimeout` fallback for environments where the animation never fires (jsdom) — guarantees
  no leaked toasts.
- `onDismiss` fires exactly once (on the `active` → `leaving` transition), so
  swipe/close/auto-dismiss/Escape/action all trigger it without double-calls.
- Radix provides pause-on-hover/focus/resume, Escape-to-close, swipe-to-dismiss, focus management
  (F8 hotkey, focus proxies) and announcements out of the box — not re-implemented.
- Styling follows repo conventions: CSS modules, semantic tokens (`--z-toast`, status colors,
  `--transition-base`), responsive full-width-on-mobile → floating card on ≥640px, reduced-motion
  respected.
- `toast.clear()` is exposed as an explicit test/cleanup helper to avoid cross-test store pollution.

**Tests performed**

- Rendering (title + description, string shorthand, id-returning dismiss)
- Stacking order (newest first), `dismissAll`
- Auto-dismiss after configured duration, `Infinity` duration, pause-on-hover/resume (fake timers)
- Close button + `onDismiss` (called once), `dismissible: false`, action button (runs + closes),
  Escape-close
- Accessibility announcements: `aria-live="assertive"` for error, `"polite"` otherwise
  (`role="status"`)
- Lifecycle: clean unmount with active toasts, no leakage into a later provider
- axe scan (`expectNoAxeViolations`) on a provider with an active toast
- e2e axe scans (`e2e/a11y.spec.ts`) on login/users/showcase still pass with the provider mounted

**Validation:** Typecheck PASS · Lint PASS · Unit tests PASS (274) · Build PASS · e2e a11y PASS

**Known limitations**

- The store is a module singleton; the optional per-instance `store` injection is not implemented
  (documented as future work if a consumer needs isolated toast stacks).
- Exit-animation removal in browsers relies on `animationend`; the CSS exit duration is
  `--transition-base` (200ms), and the 600ms fallback covers non-animating environments.
- Radix live-region text is filled on a later animation frame, so tests assert announcement
  semantics (attributes) rather than the announcer text content (jsdom does not run rAF).

---

## 2. Dialog — the single modal primitive — ✅ Complete

**Component:** `Dialog` (`src/components/ui/Dialog`) — the merge result of the former
`ConfirmDialog` (Radix AlertDialog) and the native-`<dialog>` `Dialog` (removed). One component, two
roles: confirmation (`role="alertdialog"`) and generic modal (`role="dialog"`).

**Files added**

- `src/components/ui/Dialog/Dialog.tsx` — the component (renders Radix Dialog _or_ Radix
  AlertDialog)
- `src/components/ui/Dialog/Dialog.module.css` — token-based styles (`--z-dialog` overlay,
  reduced-motion-gated entrance animation, `sm`/`md`/`lg` widths)
- `src/components/ui/Dialog/index.ts` — public exports
- `src/components/ui/Dialog/dialog.test.tsx` — 21 unit tests
- `src/components/ui/drawer.test.tsx` — the Drawer tests formerly living in `dialog.test.tsx` were
  moved here (Drawer itself is unchanged)

**Files modified**

- `src/components/ui/index.ts` — exports `Dialog` + `DialogProps` + `DialogVariant`
- `src/components/feedback/index.ts` — `ConfirmDialog` export removed (component moved to `ui/`)
- `src/components/a11y.test.tsx` — axe scans for a generic Dialog (`role="dialog"`) and a confirm
  Dialog (`role="alertdialog"`)
- `examples/showcase/pages/ComponentsPage.tsx` — demo sections (danger "Delete workspace" confirm;
  generic "Example dialog" via `footer` + `showCloseButton`)
- `examples/users-crud/pages/UsersPage.tsx` — delete confirmation uses
  `<Dialog onConfirm={handleDelete}>`; page-level `actionError` state/Alert removed (handleDelete
  rethrows so the dialog shows the error inline)
- `examples/users-crud/components/UserFormDialog.tsx` — form modal uses `Dialog` (generic mode) with
  a custom `footer` (Cancel + submit) + `showCloseButton` + `size="md"`
- `examples/users-crud/users-crud.test.tsx` — role queries: create/edit flows assert `dialog`,
  delete flow asserts `alertdialog`
- `package.json` / `package-lock.json` — added `@radix-ui/react-dialog`

**Files removed**

- `src/components/ui/Dialog.tsx`, `src/components/ui/Dialog.module.css`,
  `src/components/ui/dialog.test.tsx` — the original native-`<dialog>` `Dialog` (its tests moved to
  `drawer.test.tsx` where they applied to `Drawer`)
- `src/components/feedback/ConfirmDialog/` — renamed/relocated to `src/components/ui/Dialog/`

**Dependencies**

- `@radix-ui/react-dialog` (v1.x) and `@radix-ui/react-alert-dialog` (v1.1.x) — the same controlled
  `open`/`onOpenChange` API with different role semantics: `Dialog` gives `role="dialog"` (closes on
  outside click), `AlertDialog` gives `role="alertdialog"` (forces a decision, no outside-click
  close). Both provide focus trap, ESC handling, scroll lock and `aria-describedby` wiring. No
  native `<dialog>`.

**Important design decisions**

- `variant?: 'confirm' | 'generic'` selects the role: `'confirm'` renders Radix AlertDialog
  (`role="alertdialog"`, forces an explicit choice), `'generic'` renders Radix Dialog
  (`role="dialog"`). Defaults to `'confirm'` when `onConfirm` is provided, otherwise `'generic'` —
  consumers pick confirmation vs generic usage by whether they pass `onConfirm`.
- The two Radix roots share one content body (header + optional ✕ close, description, body, footer).
  Footer resolution: custom `footer` > built-in confirm/cancel (when `onConfirm` is set) > single
  "Close" fallback (`AlertDialog.Cancel` / `Dialog.Close`). `showCloseButton` ✕ has
  `aria-label="Close dialog"`; `size: 'sm' | 'md' | 'lg'`.
- Async confirm: `onConfirm?: () => void | Promise<void>`. Success closes the dialog; a rejection
  keeps it open and surfaces the thrown `Error.message` inline via `Alert variant="danger"` (generic
  fallback for non-`Error` rejections). `onConfirm` is optional — omit it for a pure information
  dialog.
- Loading: while submitting, the confirm button shows `loading` and BOTH buttons are `disabled`. A
  ref guard plus the disabled buttons prevent double submission.
- State resets per open via the "adjust state during render" pattern (`setSubmitting`/`setError`)
  rather than a cascading effect; the submit-guard ref is released in an effect (the
  `react-hooks/set-state-in-effect` and `react-hooks/refs` rules reject the naive alternatives).
- Focus restoration: Radix restores focus to its own `Trigger`, which does not exist in a controlled
  component. The component captures `document.activeElement` in `onOpenAutoFocus` and restores it in
  `onCloseAutoFocus` (preventing Radix's default), so focus returns to the invoking button after
  Cancel/ESC/success.
- AlertDialog does not close on outside-click (forces a decision); Dialog does (standard modal
  semantics) — both tested.
- Styling: header/body/footer layout, destructive styling via `Button variant="danger"`, compact
  `sm` default size, `--z-dialog` overlay/content layering, reduced-motion respected.

**Tests performed**

- Confirm mode: renders nothing when closed; title/description/actions; custom labels; Cancel →
  `onOpenChange(false)`; ESC → `onOpenChange(false)`; outside-click does NOT close; focus trap +
  focus restore; async confirm (buttons disabled while pending, no double submit, closes on
  resolve); sync `onConfirm`; error state on rejection (stays open, `role="alert"`, buttons
  re-enabled); generic fallback for non-`Error` rejections; state reset on reopen after closing
  mid-submit; role is `alertdialog`
- Generic mode: role is `dialog` (not `alertdialog`); single "Close" fallback button closes; closes
  on outside click (pointerdown + deferred click — Radix registers the outside listener on the next
  tick); explicit `variant="confirm"` without `onConfirm` renders an `alertdialog` with a Close
  button; explicit `variant="generic"` overrides the confirm default
- Shared: close (✕) hidden by default, shown + closes when `showCloseButton` is set; custom `footer`
  replaces the built-in buttons; `size` class applied
- axe scans (`expectNoAxeViolations`) on both an open generic Dialog and an open confirm Dialog

**Validation:** Typecheck PASS · Lint PASS · Unit tests PASS (290) · Build PASS · e2e a11y PASS

**Known limitations**

- The component assumes the invoking button holds focus when the dialog opens (standard flow);
  restoring focus is a no-op if nothing was focused.
- ESC/outside-click dismissal of Radix is not suppressed while submitting (an in-flight action still
  resolves and closes idempotently).
- In confirm mode without `onConfirm` (acknowledge-only `alertdialog`), the confirm button is
  omitted and a single "Close" button is shown.

---

## 3. Popover — ✅ Complete

**Component:** `Popover` (`src/components/ui/Popover`) — composable popover primitives built on
`@radix-ui/react-popover`.

**Files added**

- `src/components/ui/Popover/Popover.tsx` — `Popover` (root), `PopoverTrigger`, `PopoverAnchor`,
  `PopoverClose`, `PopoverContent`
- `src/components/ui/Popover/Popover.module.css` — token-based content panel + arrow, `--z-popover`
  layering, opacity-only entrance (transform is owned by Radix's collision positioning)
- `src/components/ui/Popover/index.ts` — public exports
- `src/components/ui/Popover/popover.test.tsx` — 8 unit tests

**Files modified**

- `src/components/ui/index.ts` — exports the Popover pieces
- `src/components/a11y.test.tsx` — axe scan for an open Popover
- `examples/showcase/pages/ComponentsPage.tsx` — demo in the Overlays row (Button trigger via
  `asChild`, close button)
- `src/styles/tokens.css` — added `--z-popover: 350` (between drawer and dialog)
- `src/tests/setup.ts` — polyfilled `ResizeObserver` (Radix Popper measures content with it; jsdom
  lacks it)
- `package.json` / `package-lock.json` — added `@radix-ui/react-popover`

**Dependencies**

- `@radix-ui/react-popover` (v1.x) — positioning, collision detection, viewport bounds, portal,
  focus management, ESC/outside-click dismissal, `role="dialog"` on content.

**Important design decisions**

- **Composability first:** the pieces (`Popover` root, `PopoverTrigger`, `PopoverAnchor`,
  `PopoverClose`, `PopoverContent`) are thin, styled wrappers around the Radix primitives so date
  pickers, comboboxes and command palettes build on top. Root is uncontrolled by default
  (`defaultOpen`) or controlled (`open`/`onOpenChange`); non-modal by default.
- `PopoverContent` sets `sideOffset = 8` and renders an arrow by default (`showArrow` to opt out);
  content has no accessible name by default, so consumers pass `aria-label`/`aria-labelledby` (axe
  requires named dialogs).
- Styling: `--z-popover` z-index (above drawer, below dialog), surface/border/shadow tokens,
  opacity-only entrance animation gated on `prefers-reduced-motion` (animating `transform` would
  fight Radix's inline positioning transform).

**Tests performed**

- Opens on trigger click, closes on a second click; open by default via `defaultOpen`
- Controlled `open`/`onOpenChange` (Escape → `onOpenChange(false)`)
- ESC closes and restores focus to the trigger
- Focus moves into the content on open
- Closes on outside pointer down (deferred dismissal: pointerdown + click after the listener tick)
- Arrow rendered by default, omitted with `showArrow={false}`
- axe scan (`expectNoAxeViolations`) on an open Popover

**Validation:** Typecheck PASS · Lint PASS · Unit tests PASS (299) · Build PASS · e2e a11y PASS

**Known limitations**

- The content relies on the consumer supplying an accessible name (`aria-label`) — the component
  does not auto-label from the trigger.
- jsdom does not run ResizeObserver callbacks, so layout-sensitive assertions (collision shifts) are
  covered by Radix's own tests, not the unit suite.

---

## 4. Combobox / Autocomplete — ✅ Complete

**Component:** `Combobox` (`src/components/ui/Combobox`) — WAI-ARIA combobox built on the Popover
primitive.

**Files added**

- `src/components/ui/Combobox/Combobox.tsx` — the combobox (input with `role="combobox"`, list with
  `role="listbox"`/`role="option"`, `aria-activedescendant` wiring)
- `src/components/ui/Combobox/Combobox.module.css` — token-based input (mirrors FieldControl), tags,
  listbox panel (width matched to the input via `--radix-popover-trigger-width`)
- `src/components/ui/Combobox/index.ts` — public exports (`Combobox`, `ComboboxOption`,
  `ComboboxProps`)
- `src/components/ui/Combobox/combobox.test.tsx` — 18 unit tests

**Files modified**

- `src/components/ui/index.ts` — exports the Combobox
- `src/components/a11y.test.tsx` — axe scan for an open Combobox
- `examples/showcase/pages/ComponentsPage.tsx` — demo in the Overlays row (assignee picker,
  clearable)

**Dependencies**

- `@radix-ui/react-popover` (already present) — open state, positioning, outside-click/focus
  dismissal.

**Important design decisions**

- **Uniform value API:** `value: readonly string[]` + `onValueChange` — single mode is 0/1 entries,
  multiple mode is any length. No separate "multi" boolean in the value contract.
- **Options may be static or async:** `options` is either `readonly ComboboxOption[]` or a
  `(query) => Promise<...>` loader. The loader is debounced (200 ms), race-safe (a request-id ref
  discards stale resolutions), and drives explicit loading (`role="status"`), load-error
  (`role="alert"`), and empty (`role="status"`) states.
- **Focus stays in the input:** `onOpenAutoFocus`/`onCloseAutoFocus` are suppressed, and outside
  dismissals are ignored when they originate inside the anchor (the input is the anchor, which Radix
  otherwise treats as "outside"). A `reopenOnFocusRef` flag stops a post-selection refocus from
  re-opening the list in single mode.
- **Radix dismissal gotchas (all encoded in the tests):** (1) a pointerdown on the anchor dismisses
  the popover right after it opens → suppress `onPointerDownOutside` when the target is inside the
  anchor; (2) returning focus to the input after an option click fires `onFocusOutside` → suppress
  when the target is inside the anchor; (3) focus() on an already-focused input is a no-op, but
  after an option click the input has blurred, so refocusing re-fires onFocus.
- The listbox width tracks the input width with `--radix-popover-trigger-width` (Radix sets it to
  the anchor width).

**Tests performed**

- Opens on focus, aria-expanded toggles; typing filters (typeahead)
- ↑/↓ navigation (wrapping, skipping disabled), Home/End, Enter selects and closes (single)
- `aria-activedescendant` tracks the highlighted option
- Disabled options are skipped in navigation and ignored on click
- Multiple mode: toggle selection, list stays open, removable tags, aria-selected
- Clear button clears the selection and refocuses the input
- Custom empty-state message; Escape closes and reverts the query
- Outside pointer down closes (deferred dismissal pattern)
- External `error` → `aria-invalid` + `aria-describedby` + `role="alert"` message
- Async: loading → success → re-query; loader error message; debounce coalesces rapid typing
- axe scan (`expectNoAxeViolations`) on an open Combobox

**Validation:** Typecheck PASS · Lint PASS · Unit tests PASS · Build PASS · e2e a11y PASS

---

## 5. DataTable — ✅ Complete

**Component:** `DataTable` (`src/components/ui/DataTable`) — an accessible, presentational data
table (no Radix, no new dependencies) built on the existing `Pagination` and `Popover` primitives.

**Files added**

- `src/components/ui/DataTable/DataTable.tsx` — the table (native `<table>` + `<caption>` +
  `<th scope>`, sortable headers with `aria-sort`, tri-state selection, bulk bar, column-visibility
  menu, loading/empty/error states, router-agnostic URL state)
- `src/components/ui/DataTable/DataTable.module.css` — tokens-based table, toolbar, bulk bar and
  columns-menu styles (horizontal scroll on overflow)
- `src/components/ui/DataTable/index.ts` — public exports
- `src/components/ui/DataTable/data-table.test.tsx` — 16 unit tests

**Files modified**

- `src/components/ui/index.ts` — exports the DataTable + types
- `src/components/a11y.test.tsx` — axe scan of a fully-featured DataTable with the Columns menu open
- `examples/showcase/pages/ComponentsPage.tsx` — live demo (client-side sorting, pagination,
  selection + bulk "Archive" action, column visibility)

**Dependencies**

- None added. Reuses the repo's `Pagination` (pager + page-size selector) and `Popover` (the Columns
  visibility menu). The table markup is plain HTML.

**Important design decisions**

- **Presentational + client conveniences:** `sort`, `page`, `pageSize`, `selectedRowIds` and
  `columnVisibility` are managed internally but overridable (controlled). Client-side sorting is
  applied when the active column exposes an accessor; `totalPages` switches to server-side mode
  where `data` is expected to be the current page only. Filtering stays with the consumer.
- **Strongly typed columns:** `Column<T>` with `id`, `header`, `accessorFn`/`accessorKey`, `render`,
  `sortable`, `align`, `width`, `hideable`. `Data<T extends DataTableRow>` has a stable `id`
  (`getRowId` to override); `rowLabel` supplies friendly selection labels.
- **Selection:** header checkbox with `aria-checked="mixed"` tri-state; select-all covers the
  visible page only; a bulk bar (`role="status"` count + consumer `bulkActions`) appears when rows
  are selected.
- **URL state without importing the router:** accepts `params` + `onParamsChange`. Initial
  `page`/`pageSize`/`sort` (`id:dir`)/hidden columns (`col`) are read from the params and every
  change is written back preserving unrelated params. A ref tracks the latest params so sequential
  writes compose even before the consumer feeds the updated value back down.
- **Keyboard:** native table tab order; sorting/selection operate through real buttons/checkboxes.
  `aria-sort` on `<th>` conveys direction; headers announce via the visible text.
- **States:** loading renders skeleton rows under `role="status"` + `aria-label` and sets
  `aria-busy` on the table; error renders `ErrorState` (`role="alert"`, `onRetry`); empty renders
  `EmptyState`.
- Styling follows repo conventions: CSS modules + semantic tokens, `overflow-x: auto` wrapper for
  responsive behavior, no virtualized rows (not needed at these dataset sizes).

**Tests performed**

- Rendering (caption, `th scope="col"`, headers/cells)
- Client-side sorting asc → desc → cleared, with `aria-sort` updates; numeric/string compare
- Keyboard operation of the sort header (Enter)
- Client-side pagination (slicing + `onPageChange`); server-side `totalPages` mode without slicing
- Row selection: tri-state header checkbox, bulk bar count + actions, select-all limited to the
  visible page
- Column-visibility toggle through the Columns menu; non-hideable columns omitted
- Loading (skeleton + `aria-busy`), error (+ retry), empty states
- No pagination when disabled
- URL state: initial values read from params (`page`, `pageSize`, `sort`, `col`); changes written
  back preserving unrelated params
- Custom cell renderers, `getRowId` and `rowLabel`
- axe scan (`expectNoAxeViolations`) on a fully-featured table with the Columns menu open

**Validation:** Typecheck PASS · Lint PASS · Unit tests PASS (358) · Build PASS · e2e a11y PASS

**Known limitations**

- The table applies client-side sorting/pagination internally; for server-side data the consumer
  sorts/filters/paginates and passes the current page via `totalPages` (the table is then
  presentational).
- URL state is one-way after mount for `params`-provided values (external changes to the params are
  picked up again on remount); consumers needing full two-way sync should drive the controlled
  props.
- jsdom does not run ResizeObserver/Pointer events the way a browser does, so Popover positioning is
  covered by Radix's own tests rather than this suite.

---

# Overall Assessment

The starter is already a strong foundation for freelance enterprise applications.

The goal should **not** be to keep adding libraries. The goal should be:

> Build the smallest opinionated application platform that can grow into complex enterprise
> applications without requiring architectural rewrites.

The current architecture is approximately an **8.5/10 foundation**. Addressing the P0 issues and the
highest-value P1 items would make it a much stronger master template for repeated freelance
projects.

---
