# Accessibility

The accessibility strategy of this repository: principles, component patterns, and how compliance is
verified.

## 1. Principles

1. **Native before custom.** Prefer platform elements (`<button>`, `<select>`, `<dialog>`,
   `<details>`, `<table>`) — they bring keyboard support, focus management, and screen-reader
   semantics for free. Custom widgets exist only where native elements cannot express the
   interaction (menu, tabs, tooltip, switch), and follow the WAI-ARIA APG patterns.
2. **Semantic first, ARIA second.** Use the right element (`<nav>`, `<main>`, `<h1>`…) before adding
   `role`. ARIA is added only to fill gaps the platform cannot express.
3. **Keyboard is a first-class input.** Everything reachable is operable by keyboard, with visible
   focus (`:focus-visible` rings from `tokens.css`).
4. **Never break reduced motion.** Animations and transitions respect `prefers-reduced-motion`
   (global rule in `base.css`).
5. **Accessible names are required.** Interactive elements without visible text must have
   `aria-label`/`aria-labelledby` — enforced by ESLint (`jsx-a11y`) and axe in tests.

## 2. Component-level patterns

| Pattern              | Implementation                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal dialogs        | Native `<dialog>` + `showModal()` — focus trap, ESC to close, focus restore, `aria-modal` and scroll locking come from the platform (`components/ui/Dialog.tsx`)    |
| Menus                | WAI-ARIA menu pattern: `role="menu"`, arrow-key navigation, `aria-haspopup` trigger, `aria-expanded` (`components/ui/DropdownMenu.tsx`)                             |
| Tabs                 | Roving `tabindex`, `role="tablist"/"tab"/"tabpanel"`, arrow-key switching (`components/ui/Tabs.tsx`)                                                                |
| Switch               | `<button role="switch" aria-checked>`                                                                                                                               |
| Tooltip              | Trigger with `aria-describedby` pointing at the tooltip                                                                                                             |
| Accordion            | Native `<details>/<summary>` — expand/collapse and semantics for free                                                                                               |
| Pagination           | `<nav aria-label="Pagination">` with `aria-current="page"` on the active page                                                                                       |
| Alerts/announcements | `role="alert"`/`role="status"` for static errors; `announce()` (`lib/accessibility/liveRegion.ts`) for post-action announcements like “User saved”                  |
| Forms                | Every control has a `<label>` (never placeholder-only), `aria-describedby` links hints/errors, errors render with `role="alert"` and stay associated with the field |
| Tables               | Real `<table>` with `<caption>`, `<th scope>` headers, and a visually-hidden actions column label                                                                   |
| Skeleton loading     | Container has `role="status"` + `aria-label` so the loading state is announced                                                                                      |
| Skip link            | “Skip to main content” as the first focusable element                                                                                                               |

## 3. Visual design support

- **Contrast** — tokens in `styles/tokens.css` meet WCAG 2.2 AA for text on both themes; a
  `prefers-contrast: more` media query overrides token values.
- **Focus visibility** — global `:focus-visible` outline from the focus token; never removed.
- **Touch targets** — interactive controls meet 44px minimum hit areas.
- **Color is never the only signal** — states pair color with text/iconography (e.g. status badges
  include labels, success/error alerts include icon + text).

## 4. Verification

Three layers, all in CI:

1. **Static** — ESLint `jsx-a11y` rules (label association, ARIA roles, heading structure,
   click-events-have-key-events, etc.).
2. **Unit/component** — axe-core runs against every rendered UI primitive (`expectNoAxeViolations`
   in `src/tests/a11y.ts`).
3. **E2E** — Playwright specs tagged `@a11y` scan whole pages (login, users list, component
   showcase) with `@axe-core/playwright`.

Exemptions are always inline, commented, and justified — never global.

## 5. Writing accessible components (checklist)

- [ ] Started from a native element before inventing a widget.
- [ ] Every interactive element has an accessible name.
- [ ] Keyboard operable: Tab order matches visuals; arrows/Enter/Escape where the pattern requires.
- [ ] Focus is moved and restored where the platform does not do it (dialogs/menus that don't use
      `<dialog>`).
- [ ] State is exposed (`aria-expanded`, `aria-checked`, `aria-current`, disabled states).
- [ ] Errors are announced and associated with the field.
- [ ] Meaningful changes are announced via `announce()` — not by moving focus.
- [ ] `expectNoAxeViolations` added to the component test.
