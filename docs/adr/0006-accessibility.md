# 0006 — Accessibility: native-first with axe verification

Date: 2026-08-11

## Status

Accepted

## Decision

- **Native elements before custom widgets.** `<button>`, `<select>`, `<dialog>` + `showModal()`,
  `<details>/<summary>`, `<table>`, real labels — platform semantics, keyboard support, and focus
  management are free.
- **WAI-ARIA patterns only where native cannot express the interaction**: menu (APG menu pattern),
  tabs (roving tabindex), switch (`role="switch"`), tooltip (`aria-describedby`).
- **Verification in three layers**, all in CI:
  1. static — `eslint-plugin-jsx-a11y`
  2. component — axe-core (`expectNoAxeViolations`) on every rendered UI primitive
  3. page — Playwright specs tagged `@a11y` scanning real pages with `@axe-core/playwright`
- Exemptions are inline, commented, and justified — never global.
- Design supports it: AA contrast tokens, global `:focus-visible` rings, `prefers-reduced-motion` +
  `prefers-contrast` support, `announce()` live regions for post-action messages.

## Context

Alternatives: heavy ARIA-first custom components (a11y as an afterthought in practice), or "use
Radix/shadcn for everything" (viable, but the starter's design system is small and native widgets
cover the majority of it — a component library was the wrong weight for this template).

## Consequences

- The small widget set is deliberate and high-quality instead of a large library of mediocre ones.
- Component review has a short, mechanical a11y checklist (see `docs/ACCESSIBILITY.md` §5).
- As the system grows (date pickers, comboboxes), the "native-first" rule will push new widgets
  toward proven patterns (e.g. a `<dialog>`-based picker) — and each new widget must earn its axe
  layer.
- Native widgets impose platform behavior (e.g. `<dialog>` needs the `open` prop to be controlled
  deliberately), which the Dialog/Drawer components already encapsulate.
