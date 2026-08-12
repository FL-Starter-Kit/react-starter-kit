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
- **CSRF**: the HTTP client exposes a first-class `csrf` extension point
  (`configureHttpClient({ csrf: { headerName, getToken } })` in `lib/http/configure.ts`): provide a
  token source (e.g. read from the backend's `XSRF-TOKEN` cookie) and the token is attached to every
  state-changing request. Backends without CSRF needs simply omit the option. Do not weaken SameSite
  settings for convenience.
- **Session source of truth** is the backend (`GET /api/auth/me`). Never cache permissions across
  sessions; re-evaluate on every login and on refresh.
- **Logout** invalidates the session server-side before clearing client state.

## 3. XSS defenses

- React escapes text content by default — never use `dangerouslySetInnerHTML` (ESLint-banning via
  `no-restricted-syntax` is in place where practical; keep it that way).
- URLs from the server or user input go through the guarded helpers in `src/utils/url.ts`
  (open-redirect protection for the pre-login redirect target in router navigation state).
  `javascript:` URLs are rejected.
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

## 6. Security headers and CSP — the deployment contract

Vite cannot emit response headers; the **deployment layer** (reverse proxy, CDN, or platform
ingress) owns them. The application ships no inline scripts and CSS Modules build to external files,
so a strict policy is achievable without app changes. Treat the following as the production
contract:

| Header                      | Recommended value                              | Rationale                                   |
| --------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `Content-Security-Policy`   | See the default policy below                   | Defense in depth against XSS/injection      |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforce HTTPS for one year+ (only over TLS) |
| `X-Content-Type-Options`    | `nosniff`                                      | Prevent MIME sniffing                       |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Minimal referrer leakage                    |
| `Permissions-Policy`        | Least privilege, per app needs                 | Disable unused browser features             |
| `frame-ancestors`           | `'none'` (inside CSP)                          | The app is not embeddable                   |

Recommended default CSP (mirrors `docs/SECURITY.md` §6 requirements; adjust `connect-src` to match
`VITE_API_BASE_URL` — it must equal the API origin):

```text
default-src 'self';
script-src 'self';
style-src 'self';
connect-src 'self' https://api.example.com;
img-src 'self' data:;
font-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none'
```

### Nginx reference

```nginx
# Serve the built SPA (dist/) — place headers on the location that
# serves index.html and assets, plus cache/redirect rules as needed.
location / {
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.example.com; img-src 'self' data:; font-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'" always;
}
```

### CDN / cloud hosting

- **CDN (CloudFront, Cloudflare, Fastly):** set the same headers in the response-headers policy /
  transform rules; revalidate or purge cached copies any time the CSP changes.
- **Hosting platforms (Vercel, Netlify, Fly.io, etc.):** use the platform's header configuration
  (`_headers` file, `vercel.json`, etc.) — see each platform's docs; do not assume defaults are
  secure.
- **WebSocket / SSE:** if the app uses `wss://`, add the origin to `connect-src` alongside the API
  URL.
- **Staging vs production:** CSP `report-uri`/`report-to` may be used on staging to gather
  violations before hardening production (see §6.1).

### App-side responsibilities (what this repository does)

- No inline scripts/styles in `index.html` (so `script-src 'self'` holds).
- The mock worker (`public/mockServiceWorker.js`) is dev-only and must not be deployed (it is served
  from `public/` — exclude it from production hosting or verify it is unreachable).
- Runtime data is validated with Zod, URL targets are guarded (see §2), and dynamic URLs in CSP
  (`connect-src`) are documented in the deployment checklist below.

## 6.1 CSP reporting (optional)

To adopt a strict policy without breaking production, deploy in report-only mode first:

```text
Content-Security-Policy-Report-Only: default-src 'self'; ... ; report-uri /csp-report
```

Collect violations, fix offenders, then switch to enforcement. The application itself never needs
`unsafe-inline` in `script-src`.

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
