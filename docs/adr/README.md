# Architecture Decision Records

Decisions that shape the architecture, recorded so future changes know the context and the
consequences.

## Index

| ADR                                                  | Decision                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| [0001-build-tooling.md](0001-build-tooling.md)       | Vite + TypeScript (strict) as the build foundation                 |
| [0002-state-management.md](0002-state-management.md) | TanStack Query for server state; URL for filter/pagination state   |
| [0003-styling.md](0003-styling.md)                   | CSS Modules + design tokens; no runtime UI framework               |
| [0004-folder-structure.md](0004-folder-structure.md) | Feature-oriented structure with enforced dependency boundaries     |
| [0005-api-architecture.md](0005-api-architecture.md) | Single typed HTTP client with validation, retries, and 401 refresh |
| [0006-accessibility.md](0006-accessibility.md)       | Native-first accessibility with axe verification                   |
| [0007-auth.md](0007-auth.md)                         | httpOnly-cookie sessions with single-flight refresh                |

New records: copy the template below and follow the numbering.

## Template

```markdown
# NNNN-Title

Date: YYYY-MM-DD

## Status

Accepted | Proposed | Superseded by NNNN

## Context

What problem existed and what options were considered.

## Decision

What we chose and why.

## Consequences

What becomes easier and harder as a result.
```
