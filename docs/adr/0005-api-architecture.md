# 0005 — API architecture: one typed HTTP client

Date: 2026-08-11

## Status

Accepted

## Decision

All network access flows through a single configured client (`src/lib/http/client.ts`):

- **One instance** — `httpClient`, configured once in bootstrap from validated env
  (`lib/http/configure.ts`). Raw `fetch` outside this module is a lint violation.
- **Feature API layers** (`features/<name>/api/*Api.ts`) define endpoints with Zod validation
  functions and typed responses.
- Built-in behaviors, used by every request:
  - timeout with cancellation (external `AbortSignal` wiring, so TanStack Query can cancel)
  - retry with exponential backoff + jitter for network errors and 408/429/5xx, honoring
    `Retry-After`
  - `X-Request-Id` correlation on every request, logged end-to-end
  - runtime response validation — a contract violation throws a typed `ApiError` (loud for
    developers, generic for users)
  - normalized error objects with stable `ErrorCode`s and `fieldErrors` for form display
  - **single-flight 401 refresh**: one silent refresh for all concurrent 401s, then one retry of the
    original request; auth endpoints opt out via `skipUnauthorizedHandler` to prevent re-entrancy

## Context

Options: per-feature `fetch` wrappers (duplicated timeout/error/retry logic, inconsistent 401
handling), a third-party client like axios (fine, but adds a dependency for behavior this layer
already needs and adds another API to learn), or one hand-rolled client (chosen).

## Consequences

- Security-sensitive behavior (401 handling, validation at trust boundaries) lives in exactly one
  place.
- Adding a new endpoint is mechanical: define the schema, add the API method, done.
- The client is the natural chokepoint for future needs (CSRF header injection, telemetry, offline
  queueing).
- It is owned code with tests — a maintenance cost that the behavior density justifies.
