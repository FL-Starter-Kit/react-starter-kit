# 0002 — State management: TanStack Query + URL state

Date: 2026-08-11

## Status

Accepted

## Decision

- **Server state → TanStack Query v5.** Every read/write to the backend flows through feature-level
  query hooks with centralized query keys. Mutations invalidate their query keys on success; list
  queries use `keepPreviousData` so pagination never flashes skeletons. Query-client tuning lives in
  `app/providers/QueryProvider` (production) and `tests/render.tsx` (deterministic test client:
  `retry: false`, `staleTime: Infinity`).
- **URL-filterable state → the URL.** List filters, pagination, and return paths live in search
  params (`useSearchParams`), making them deep-linkable and refresh-safe. Components derive from the
  URL; they never keep a parallel copy.
- **Transient UI state → local `useState`.** Dialog open state and similar ephemeral state stays in
  the owning component.
- **Global UI state → context, sparingly.** Theme, session. Persisted theme uses `safeStorage`
  (ESLint forbids raw `localStorage`).

## Context

The alternatives considered: Redux (global store for everything — heavy ceremony, poor fit for async
server state), Zustand (fine for UI state, but doesn't solve server caching/deduplication), and
component-local state for everything (cannot deduplicate or cache across navigation).

## Consequences

- Server data is cached, deduplicated, and background-refreshed with near-zero custom code.
- URL-driven lists get "share a filtered view" behavior for free, and the URL is the single source
  of truth (no state desync between filters and results).
- Less state to reason about in React itself; the discipline of "server → Query, URL → search
  params, rest → local" removes most state-management debates in review.
- Query invalidation timing is the main new subtlety (documented in `docs/TESTING.md`).
