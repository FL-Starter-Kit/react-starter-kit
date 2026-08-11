# Security

The security model of the application and the rules developers must follow.

## 1. Threat model

This is a **frontend** repository. The browser is a hostile, transparent environment: anything
shipped to the client can be read and replayed by users. The frontend cannot keep secrets, cannot be
trusted to authorize, and must treat the backend as the only enforcement point.

Assets worth protecting:

- **Session** — a stolen/validated session is the account. Protected by httpOnly cookies,
  single-flight refresh, and strict CSP.
- **User data** — only ever rendered from validated shapes; the UI must not be a vector for XSS.
- **Backend trust** — every request is validated at runtime against a Zod schema; contract
  violations fail loudly.

## 2. Auth and sessions

- **httpOnly cookie sessions.** The token never enters JavaScript memory (`tokenStorage` only reads
  the session cookie; `localStorage`/`sessionStorage` storage of tokens is banned by ESLint). XSS
  cannot exfiltrate the session.
- **Single-flight refresh.** On a 401 (excluding auth endpoints), one silent refresh runs and all
  concurrent failures await it, then the original request retries once. See `lib/http/client.ts` +
  `lib/auth/refreshSession.ts`.
- **CSRF**: the auth layer is designed to use SameSite cookies plus a backend-issued anti-CSRF token
  attached via the HTTP client's `defaultHeaders` when the backend requires it (hook exists, backend
  not part of this repo). Do not weaken SameSite settings for convenience.
- **Session source of truth** is the backend (`GET /api/auth/me`). Never cache permissions across
  sessions; re-evaluate on every login and on refresh.
- **Logout** invalidates the session server-side before clearing client state.

## 3. XSS defenses

- React escapes text content by default — never use `dangerouslySetInnerHTML` (ESLint-banning via
  `no-restricted-syntax` is in place where practical; keep it that way).
- URLs from the server or user input go through the guarded helpers in `src/utils/url.ts`
  (open-redirect protection for `returnPath` handling). `javascript:` URLs are rejected.
- No user input is ever concatenated into HTML, CSS, or SVG.
- Runtime-validate server payloads (Zod) before rendering — a malformed/unexpected payload must fail
  loudly for developers, not render garbage (see `lib/http/client.ts` validation).

## 4. Frontend environment variables are not secrets

`VITE_*` variables are compiled into the bundle. Never put API keys, tokens, or passwords in them.
Secrets live server-side only. The `src/app/config/env.ts` validation is for shape and values, not
secrecy.

## 5. Dependencies and supply chain

- `package-lock.json` is committed; installs use `npm ci` in CI for reproducibility.
- `npm audit` runs in CI on every push.
- Dependencies are pinned to verified-compatible majors (see `PROGRESS.md` stack table). Do not
  upgrade blindly — record any change in `PROGRESS.md`.
- `npm audit` failures block the PR.

## 6. CSP (production checklist)

The production server must emit a Content-Security-Policy that at minimum:

- `default-src 'self'`
- `script-src 'self'` (no unsafe-inline; the app ships no inline scripts)
- `style-src 'self' 'unsafe-inline'` only if inline styles cannot be eliminated (CSS Modules ship as
  external files)
- `connect-src 'self' <VITE_API_BASE_URL>`
- `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`

`VITE_PUBLIC_URL` is available for canonical URLs. The mock worker (`public/mockServiceWorker.js`)
is dev-only and must not be served in production builds.

## 7. Logging and data handling

- The logger (`lib/logging/logger.ts`) redacts known sensitive fields (tokens, passwords, cookies)
  before writing; never log request bodies or full cookie values.
- Correlation IDs (`X-Request-Id`) flow end-to-end so server logs can be tied to client incidents.
- User-facing error messages never expose stack traces or internals — the ErrorState components
  render generic copy.

## 8. Testing security-sensitive paths

- 401 refresh flow is integration-tested (`scenario.auth.expireNextRequest`).
- Forbidden actions (self-delete, permission-gated UI) are covered by component + integration tests.
- The permission table (`lib/auth/permissions.ts`) is unit-tested exhaustively.
