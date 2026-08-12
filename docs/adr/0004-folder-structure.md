# 0004 — Folder structure: feature-oriented with enforced boundaries

Date: 2026-08-11

## Status

Accepted

## Decision

- Code is organized by **feature** (`src/features/<name>/`) with internal layers: `models/`,
  `schemas/`, `api/`, `utils/`, `hooks/`, `components/`, `pages/`. Shared infrastructure lives
  outside features: `app/` (shell), `components/` (primitives), `lib/` (framework-agnostic
  libraries), `hooks/`, `utils/`, `types/`.
- Dependency direction is bottom-up and **enforced by ESLint** `no-restricted-paths` zones:
  - `components/` must not import `app/` or `features/`
  - a feature must not import another feature
  - `lib/` must not import components, features, or app (no React components in lib)
  - `hooks/` must not import components/features
- When a zone rule fires, the fix is architectural (move the code), not a rule exception.

## Context

Alternatives: layers-first structure (`src/components/`, `src/services/`, ...) which scatters one
feature's code across the tree and makes feature ownership impossible; or no structure at all, which
decays into a dependency swamp in any codebase this size.

## Consequences

- A feature is independently readable, testable, and portable: `features/users/` is the reference
  example.
- Boundaries keep the architecture diagram honest — lint fails before review has to.
- Enforcement cost: developers occasionally fight the zones (e.g. a guard that wanted a Spinner).
  The documented resolution pattern (move shared pieces into `app/` or the primitive layer) keeps
  the rules stable.
- Known evolution pressure: "shared feature code" (e.g. two features needing a common widget)
  belongs in `components/` or `lib/`, decided by layer, not by convenience.
- A feature-level `services/` layer was considered and rejected: pure domain helpers (labels,
  initials, permissions) are `utils/`; endpoint orchestration lives in `api/` + `hooks/` — a named
  "service" layer invites god-object accumulation (see `PR 0004` review feedback).
