# 0003 — Styling: CSS Modules + design tokens, no UI framework

Date: 2026-08-11

## Status

Accepted

## Decision

- **CSS Modules** scoped per component (`Button.module.css`), with `classNameStrategy: 'non-scoped'`
  in the Vite config so test assertions can target readable class names.
- **Design tokens** as CSS custom properties in `src/styles/tokens.css` — colors (light + dark),
  spacing, type scale, radius, shadows, z-index, breakpoints, transitions, focus rings — consumed
  exclusively by components.
- **Two token layers.** _Primitive tokens_ (raw, theme-agnostic values: `--blue-500`, `--gray-700`,
  `--space-4`, `--radius-md`) live on `:root` and never flip with theme. _Semantic tokens_
  (role-based: `--color-surface`, `--color-text-primary`, `--color-action-primary`,
  `--color-border`) reference primitives and are remapped per theme (`[data-theme='dark']`,
  `prefers-contrast`). Components consume semantic tokens only; client-specific branding overrides
  the semantic mapping (or the primitives it references) without touching components.
- **No Tailwind, no runtime CSS-in-JS, no component library.** Zero runtime styling dependencies.
- Dark mode via `[data-theme='dark']` on the root; high-contrast via `prefers-contrast` overrides;
  reduced motion via `prefers-reduced-motion`.

## Context

Options: Tailwind (utility classes — fast but pushes design decisions into markup and fights the
design-token approach), styled-components/emotion (runtime cost, SSR complexity, not needed for a
token-based design), MUI/shadcn (vendor the design system instead of owning it).

## Decision rationale

This starter is a template for teams that own their design system. Tokens + modules give the
composability of a design system without a framework lock-in; custom properties flip themes with a
single attribute; and there is nothing to audit for runtime cost.

## Consequences

- Theming and token changes are global by construction (edit `tokens.css`).
- Component CSS is locally scoped — no cascade collisions between features.
- Writing new components requires understanding the token set (a small learning cost) and a PR
  discipline of "extend the tokens, don't hardcode."
- `unsafe-inline` style usage in CSP is minimized because styles ship as external files.
