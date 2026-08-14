# React Starter Kit — Issues & Improvements

## Overview

This document consolidates the issues, risks, and recommended improvements identified during the
review of the React starter kit.

### Priority legend

- **P0 — Fix before using as the master starter**
- **P1 — Fix/add before serious client projects**
- **P2 — Valuable enhancement**
- **P3 — Optional / future**

---

# P0 — Fix Before Making This the Master Starter

## 1. QueryClient is recreated on provider render — ✅ Fixed

**Area:** TanStack Query / Providers

The `QueryProvider` creates a new `QueryClient` whenever the provider renders.

### Risk

A QueryClient should remain stable for the lifetime of the application. Recreating it can cause:

- loss of query cache
- unnecessary refetching
- unexpected query lifecycle behavior
- cache invalidation/state resets

### Recommendation

Create the client once, for example with lazy `useState` initialization:

```tsx
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

**Priority:** P0

---

## 2. ProtectedRoute performs a side effect during render — ✅ Fixed

**Area:** Authentication / Routing

The protected route updates return-path storage while rendering.

### Risk

Side effects during render are undesirable in React and can become problematic with:

- concurrent rendering
- Strict Mode
- repeated renders
- future React features

### Recommendation

Prefer React Router navigation state or perform persistent storage updates inside an effect.

Ideally:

```text
Protected route
      ↓
Navigate to login
      ↓
state: { from: attemptedLocation }
      ↓
login succeeds
      ↓
navigate back to original location
```

**Priority:** P0

---

## 3. Authentication refresh failure should explicitly transition to unauthenticated — ✅ Fixed

**Area:** Authentication

The refresh flow is sophisticated and already uses a single-flight approach, but refresh failure
should have a single authoritative authentication transition.

### Risk

Without a centralized transition, multiple queries/components may independently discover that the
session has expired.

This can lead to:

- repeated failures
- inconsistent UI
- unnecessary requests
- difficult-to-debug authentication state

### Recommendation

Model the authentication lifecycle explicitly:

```text
authenticated
      ↓
401
      ↓
refresh
      ↓
success ─────→ authenticated
      ↓
failure
      ↓
unauthenticated
      ↓
login
```

**Priority:** P0

---

## 4. Production sourcemaps should not be enabled by default — ✅ Fixed

**Area:** Build / Security

The Vite build currently enables sourcemaps.

### Risk

Public production sourcemaps can expose:

- source code
- internal file structure
- implementation details
- potentially sensitive comments or metadata

### Recommendation

Use one of:

- no production sourcemaps
- hidden sourcemaps uploaded only to an error-monitoring platform
- sourcemaps enabled only for internal environments

**Priority:** P0

---

## 5. Remove committed `.deb` packages — ✅ Fixed

**Area:** Repository / CI

Linux `.deb` packages are present in the repository.

### Risk

This creates:

- unnecessary repository size
- OS/environment coupling
- maintenance overhead
- confusing dependency ownership

### Recommendation

Install required browser/system dependencies through CI/container setup instead.

For Playwright, use its supported dependency installation or a suitable CI/container image.

**Priority:** P0

---

## 6. Review Tabs keyboard and focus handling — ✅ Fixed

**Area:** Accessibility / UI primitives

The Tabs component has good keyboard-navigation intentions, but there are edge cases around focus
management and disabled tabs.

### Issues to review

- `tablist` should not unnecessarily become an additional keyboard stop
- Home/End should skip disabled tabs
- Arrow navigation should always select/focus the next enabled tab
- roving `tabIndex` should remain consistent
- focus behavior should follow the WAI-ARIA Tabs pattern

### Recommendation

Implement the tabs interaction model around:

```text
ArrowLeft / ArrowRight
Home / End
disabled-tab skipping
roving tabindex
focus restoration
```

**Priority:** P0

---

## 7. Tooltip semantics need another accessibility pass — ✅ Fixed

**Area:** Accessibility / UI primitives

The tooltip implementation supports behavior that can become interactive.

### Risk

An interactive tooltip is generally a sign that the component should instead be a Popover.

### Recommendation

Keep responsibilities separate:

```text
Tooltip
  → non-interactive supplementary information

Popover
  → interactive floating content

DropdownMenu
  → menu commands/actions
```

Also ensure:

- timers are cleaned up
- tooltip content does not become an accidental keyboard target
- focus/hover behavior follows expected tooltip semantics

**Priority:** P0

---

## 8. Security headers and CSP need an explicit deployment contract — ✅ Fixed

**Area:** Security

The starter discusses security but should clearly distinguish application responsibilities from
deployment/server responsibilities.

### Recommended deployment headers

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors
```

### Recommendation

Add deployment documentation showing recommended secure defaults for:

- Nginx
- CDN
- cloud hosting
- reverse proxy

Do not assume Vite itself can provide all of these.

**Priority:** P0

---

## 9. Make CSRF integration an explicit extension point — ✅ Fixed

**Area:** Authentication / HTTP

The cookie-based authentication model is strong, but CSRF handling should be a first-class
configurable mechanism.

### Recommendation

Provide an abstraction such as:

```ts
configureHttpClient({
  csrfProvider,
});
```

This allows projects to support different backend patterns:

```text
HttpOnly session cookie
CSRF cookie + header
BFF
OAuth/OIDC
Authorization header
```

without rewriting the HTTP layer.

**Priority:** P0

---

## 10. Add typed URL/query-parameter parsing — ✅ Fixed

**Area:** Routing / URL state

URL state is correctly preferred for things such as:

- pagination
- filters
- search
- sorting

However, parsing URL parameters manually can lead to inconsistent validation.

### Risk

Example:

```ts
Number(searchParams.get('page'));
```

can produce invalid or unexpected values.

### Recommendation

Use a schema-driven approach:

```text
URL
 ↓
Zod schema
 ↓
typed feature query state
```

Example:

```text
/users?page=abc
```

should deterministically fall back to a safe value.

**Priority:** P0

---

# P1 — Fix/Add Before Serious Client Projects

## 11. Reconsider the default `services/` layer — ✅ Fixed

**Area:** Architecture

Feature folders currently contain a `services/` layer.

### Risk

A generic service directory tends to become a dumping ground:

```text
UserService
ProjectService
BillingService
DashboardService
PermissionService
```

### Recommendation

Prefer more explicit responsibilities:

```text
api/
hooks/
models/
schemas/
utils/
components/
```

Use a service abstraction only when it represents a genuinely distinct responsibility.

**Priority:** P1

---

## 12. Add a reusable enterprise DataTable

This is probably the highest-value missing UI primitive.

### Recommended capabilities

```text
sorting
server-side pagination
server-side filtering
column visibility
row selection
bulk actions
loading state
empty state
error state
responsive behavior
keyboard navigation
URL state
```

Do not build an unnecessarily huge custom table if a mature headless/table engine can provide the
hard parts.

**Priority:** P1

---

## 13. Add a Toast/Notification system

A reusable notification system is needed across almost every client application.

Recommended capabilities:

```text
success
info
warning
error
dismiss
auto-dismiss
action button
stacking
accessibility announcements
```

**Priority:** P1

---

## 14. Add ConfirmDialog

Dangerous operations should use a standardized confirmation component.

Examples:

```text
Delete user
Remove organization member
Cancel subscription
Discard changes
```

The component should support:

- focus management
- Escape
- focus restoration
- destructive styling
- loading state
- async confirmation

**Priority:** P1

---

## 15. Add a proper Popover primitive

A reusable Popover should provide:

- positioning
- collision detection
- viewport boundary handling
- focus management
- portal support
- keyboard dismissal
- anchor alignment

This can also support:

```text
date picker
filters
combobox
command palette
contextual actions
```

**Priority:** P1

---

## 16. Add Combobox/Autocomplete

This is a common enterprise UI requirement.

It should support:

```text
keyboard navigation
typeahead
async loading
empty state
disabled options
multi-select
clear
loading
ARIA semantics
```

**Priority:** P1

---

## 17. Add FileUpload

A reusable enterprise file-upload primitive would be highly valuable.

Consider:

```text
drag & drop
file picker
file type validation
size validation
multiple files
progress
cancel
retry
server errors
preview
accessibility
```

**Priority:** P1

---

## 18. Establish a formal error taxonomy — ✅ Fixed

Current error normalization is already good, but the starter should make the hierarchy explicit.

Suggested model:

```text
AppError
├── ApiError
│   ├── Unauthorized
│   ├── Forbidden
│   ├── Validation
│   ├── Conflict
│   ├── NotFound
│   ├── RateLimited
│   └── Server
├── NetworkError
├── ValidationError
└── UnexpectedError
```

This makes UI behavior consistent.

**Status:** implemented as a single normalized `ApiError` class + stable `ErrorCode` enum
(`src/lib/http/errors.ts`, `src/types/api.ts`) covering every leaf type above (incl. Network,
Timeout, Aborted, BadRequest), with per-code user-safe default messages and field-error envelopes —
documented in `docs/ARCHITECTURE.md` §6 ("Normalized errors").

**Priority:** P1

---

## 19. Add telemetry/error-reporting abstraction — ✅ Fixed

Add a thin abstraction rather than hard-coding a vendor.

Example:

```ts
reportError(error, {
  feature: 'users',
  action: 'create-user',
});
```

Potential implementations:

```text
Sentry
Datadog
New Relic
Azure Monitor
OpenTelemetry
```

**Priority:** P1

---

## 20. Add dependency update automation

Use:

- Dependabot, or
- Renovate

Recommended targets:

```text
React
React Router
Vite
TypeScript
TanStack Query
Playwright
ESLint
Zod
```

Use controlled update groups rather than blindly updating everything.

**Priority:** P1

---

## 21. Add code generators — ✅ Fixed

For repeated freelance work, generators can significantly improve productivity.

Examples:

```bash
npm run generate feature users
npm run generate component DataTable
npm run generate hook useUsers
npm run generate api users
```

Generated feature structure:

```text
features/users/
├── api/
├── components/
├── hooks/
├── models/
├── schemas/
└── utils/
```

Implemented as `scripts/generate.mjs` (dependency-free Node ESM, run via `npm run generate`).
Skeletons follow the repo conventions (feature anatomy incl. `pages/`, `httpClient` API layer,
TanStack Query hooks, Zod schemas, CSS Modules) and pass `npm run check` as-is. Generators never
overwrite existing files. Usage + rules documented in `docs/CONTRIBUTING.md` §8 and `README.md`;
tests in `src/tests/generate.test.ts`.

**Priority:** P1

---

## 22. Separate reference/demo features from the core starter

Avoid shipping client projects with demo business logic.

Prefer:

```text
src/
  app/
  components/
  features/
  lib/

examples/
  users-crud/
  auth/
```

This keeps the actual project clean while preserving reference implementations.

**Priority:** P1

---

## 23. Align Node version requirements

The package configuration and CI should communicate the same supported Node version policy.

Avoid unnecessarily tying the starter to a specific Node patch version unless required.

Recommended approach:

```text
Supported Node major versions
+
.nvmrc
+
CI matrix or single supported version
+
package.json engines
```

**Priority:** P1

---

# P2 — Valuable Enhancements

## 24. Introduce primitive vs semantic design tokens

Separate:

### Primitive tokens

```text
blue-500
gray-700
space-4
radius-md
```

from:

### Semantic tokens

```text
color-action-primary
color-surface
color-text-primary
color-text-secondary
color-border
```

Semantic tokens make client-specific branding much easier.

**Priority:** P2

---

## 25. Add complex workflow/state-machine guidance

Do not add a state-machine library by default.

Instead document when to use one.

For workflows like:

```text
Draft
 ↓
Submitting
 ↓
Processing
 ↓
Completed
```

avoid many independent booleans.

Use a state machine only when the workflow actually warrants it.

**Priority:** P2

---

## 26. Add CODEOWNERS / ownership conventions

Useful when the project grows beyond a single developer.

Suggested ownership boundaries:

```text
components/
lib/
features/
tests/
```

**Priority:** P2

---

## 27. Add project profiles

Create documented project presets rather than multiple codebases.

Examples:

```text
SaaS
Admin
Dashboard
E-commerce
Marketing
```

Example SaaS profile:

```text
auth
organizations
roles
billing
settings
```

Example Admin profile:

```text
auth
users
roles
permissions
tables
filters
audit
```

**Priority:** P2

---

## 28. Add an AI development contract

Since the repository is intended for AI-assisted development, add:

```text
AGENTS.md
AI_RULES.md
```

Document:

```text
architecture rules
dependency rules
React conventions
accessibility requirements
testing requirements
security requirements
API conventions
naming conventions
```

This gives every AI coding agent the same project contract.

**Priority:** P2

---

## 29. Add OpenAPI integration/code generation

For API-heavy freelance projects, consider supporting:

```text
OpenAPI
 ↓
generated types
 ↓
generated API client
 ↓
TanStack Query integration
```

This can eliminate repetitive manual API typing.

**Priority:** P2

---

## 30. Consider Storybook only if the component library grows

Storybook is useful for:

- component development
- visual review
- accessibility checks
- documentation
- client handoff

But it should not be mandatory for every small freelance project.

**Priority:** P2

---

## 31. Consider visual regression testing later

Once the UI system becomes stable, consider:

```text
Playwright screenshots
or
Chromatic / similar tooling
```

This is particularly useful for shared UI components.

**Priority:** P2

---

# P3 — Optional / Future

## 32. Internationalization

Do not add i18n libraries by default.

But ensure the architecture does not make localization difficult.

Consider later:

```text
i18next
FormatJS
native Intl APIs
```

**Priority:** P3

---

## 33. PWA/offline support

Only introduce this for projects that actually require:

- offline operation
- installability
- background synchronization
- caching strategies

**Priority:** P3

---

## 34. Advanced performance instrumentation

Eventually consider:

```text
Web Vitals
React performance profiling
route timing
API timing
bundle analysis
long-task detection
```

This is useful for mature client applications but not required in the base starter.

**Priority:** P3

---

# Architectural Principles to Preserve

These are strengths of the existing starter and should remain part of the foundation.

## Server state

```text
TanStack Query
```

Do not move API state into Redux/Zustand without a concrete requirement.

## URL state

```text
Router/Search Params
```

Use URL state for:

```text
filters
search
pagination
sorting
selected views
```

## Local UI state

```text
useState
useReducer
```

## Global UI state

```text
Context — sparingly
```

## Complex workflow state

```text
State machine — only when justified
```

## API boundary

Keep:

```text
HTTP client
    ↓
API module
    ↓
runtime validation
    ↓
feature hooks
    ↓
components
```

## Accessibility

Prefer:

```text
native HTML
    ↓
semantic HTML
    ↓
ARIA
    ↓
custom interaction only when necessary
```

## Architecture enforcement

Continue using ESLint/import boundaries to enforce architectural rules rather than relying only on
documentation.

---

# Recommended Target Architecture

```text
src/
│
├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── layouts/
│   ├── providers/
│   ├── router/
│   └── errors/
│
├── components/
│   ├── ui/
│   ├── feedback/
│   ├── layout/
│   └── navigation/
│
├── features/
│   ├── auth/
│   ├── users/
│   └── ...
│
├── lib/
│   ├── auth/
│   ├── http/
│   ├── logging/
│   ├── telemetry/
│   ├── storage/
│   └── accessibility/
│
├── hooks/
│
├── styles/
│   ├── tokens.css
│   └── base.css
│
├── tests/
│   ├── mocks/
│   ├── render.tsx
│   └── setup.ts
│
├── types/
│
└── utils/
```

Recommended dependency direction:

```text
                    APP
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      FEATURES             COMPONENTS
          │                     │
          └──────────┬──────────┘
                     ↓
                    LIB
                     ↓
                   UTILS
```

State ownership:

```text
SERVER STATE  → TanStack Query

URL STATE     → Router/Search Params

LOCAL UI      → useState/useReducer

GLOBAL UI     → Context

COMPLEX FLOW  → State Machine when justified
```

---

# Final Priority Summary

## Must fix first

- [x] Stable QueryClient — lazy `useState` init in `src/app/providers/QueryProvider.tsx`
- [x] Remove ProtectedRoute render-time side effect — uses navigation state
      (`src/app/guards/guards.tsx`)
- [x] Centralize auth refresh failure handling — single authoritative `expireSession` transition
      (`src/lib/auth/refreshSession.ts`, `AuthContext.tsx`)
- [x] Disable/hide production sourcemaps — off by default, `SOURCEMAP=true` opts into hidden maps
      (`vite.config.ts`)
- [x] Remove `.deb` packages — deleted from git; `*.deb` gitignored
- [x] Complete Tabs accessibility review — no tablist tab stop, Home/End skip disabled, consistent
      roving tabindex (`src/components/ui/Tabs.tsx`)
- [x] Separate Tooltip and Popover semantics — non-interactive tooltip only, timers cleaned up
      (`src/components/ui/Tooltip.tsx`)
- [x] Document security headers/CSP — deployment contract in `docs/SECURITY.md` (§6)
- [x] Make CSRF configurable — `configureHttpClient({ csrf: { headerName, getToken } })`
      (`src/lib/http/configure.ts`, `client.ts`)
- [x] Add typed URL parameter parsing — `parseQueryParams` (`src/utils/url.ts`) + schema-driven
      offsets in `UsersPage`

## Next most valuable

- [ ] Enterprise DataTable
- [ ] Toast/notification system
- [ ] ConfirmDialog
- [ ] Popover
- [ ] Combobox/Autocomplete
- [ ] FileUpload
- [x] Error taxonomy — explicit via `ApiError` + `ErrorCode` (src/lib/http/errors.ts,
      docs/ARCHITECTURE.md §6)
- [x] Telemetry abstraction — vendor-neutral via `logger.setTransport` (src/lib/logging/logger.ts)
- [ ] Dependency automation
- [x] Code generators — `scripts/generate.mjs`, `npm run generate ...` (feature/component/hook/api)
- [x] Separate examples from core starter

## Longer-term

- [ ] Semantic design tokens
- [ ] State-machine guidance
- [ ] CODEOWNERS
- [ ] Project profiles
- [ ] AGENTS.md / AI_RULES.md
- [ ] OpenAPI integration
- [ ] Storybook
- [ ] Visual regression
- [ ] i18n
- [ ] PWA/offline support
- [ ] Advanced performance instrumentation

---

# Overall Assessment

The starter is already a strong foundation for freelance enterprise applications.

The goal should **not** be to keep adding libraries. The goal should be:

> Build the smallest opinionated application platform that can grow into complex enterprise
> applications without requiring architectural rewrites.

The current architecture is approximately an **8.5/10 foundation**. Addressing the P0 issues and the
highest-value P1 items would make it a much stronger master template for repeated freelance
projects.

---

# Caveats on "Fixed" Markers

Items marked ✅ Fixed above are implemented in the codebase, but a few deviate from what the
original recommendation proposed. The differences are intentional design choices; revisit them if
the intent diverges from the codebase's actual model:

## Error taxonomy (#18)

The suggested model was a class hierarchy (`AppError` → `ApiError` → `Unauthorized`/`Forbidden`/...,
plus `NetworkError`/`ValidationError`/`UnexpectedError`). The codebase instead implements a flat
**single `ApiError` class + stable `ErrorCode` enum** (`src/lib/http/errors.ts`, `src/types/api.ts`)
with normalized defaults and field-error envelopes.

- Equivalent outcome: an explicit, exhaustive taxonomy with consistent UI behavior — but errors are
  distinguished by `error.code` (e.g. `ErrorCode.Unauthorized`), not by `instanceof` subclasses.
- If `instanceof`-based handling (or typed subclasses that can carry extra data) is ever needed, the
  enum model would need to be revisited.

## Telemetry abstraction (#19)

The suggested API was a dedicated `reportError(error, { feature, action })` helper. The codebase
instead exposes the logging abstraction: `logger.error(message, context, error)` plus
`logger.setTransport(...)` for forwarding to a vendor (Sentry/OTel/etc.).

- Equivalent outcome: vendor-neutral error reporting with feature/action context — but the calling
  convention is `logger.error('...', { feature: 'users', action: 'create-user' }, error)` instead of
  `reportError(...)`, and there is no error-aware batching/rate-limiting beyond what a custom
  transport implements.
- A thin `reportError` wrapper can be added on top of the logger if a single entry point for
  error-only reporting (vs. generic logging) is preferred.
