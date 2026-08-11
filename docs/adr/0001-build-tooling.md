# 0001 — Build tooling: Vite + TypeScript (strict)

Date: 2026-08-11

## Status

Accepted

## Context

The starter needed a build foundation with fast iteration for development, production-quality output
(code splitting, asset handling), and a type system strict enough to be a design tool. Candidates
considered: Vite (with esbuild/rolldown), Next.js (server-oriented, heavy), and webpack (slow,
configuration-heavy).

## Decision

- **Vite** as the build tool and dev server (with Vitest for unit/component tests sharing the same
  configuration).
- **TypeScript 5.9** with the strictest practical settings: `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`.
- **ESLint 9 flat config** with typescript-eslint (type-aware rules), react-hooks v7, jsx-a11y,
  react-refresh, import-x ordering, and `no-restricted-paths` architecture zones.
- Version constraints recorded in `PROGRESS.md`: TypeScript must stay < 6.1 (typescript-eslint
  peer), ESLint must stay v9 (jsx-a11y peer).

## Consequences

- Fast HMR and a single config surface for build and tests.
- Strict types catch a class of bugs at compile time; the discipline pays for itself in the
  auth/http layers where the types are subtle.
- The toolchain is pinned by peer constraints — upgrading is a coordinated, tested change, not an
  accident (see `docs/CODING_STANDARDS.md` §9).
