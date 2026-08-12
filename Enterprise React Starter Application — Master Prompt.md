# Enterprise React Starter Application — Master Prompt

You are a **senior/staff-level frontend architect** specializing in React, TypeScript,
accessibility, frontend architecture, security, testing, performance, and enterprise-scale
applications.

Your task is to design and implement a **production-ready React starter application** that will
serve as the foundation for building large enterprise applications.

This is **NOT a demo application, tutorial, toy project, or CRUD example**.

The resulting codebase should be designed to support a large team, multiple feature teams, hundreds
of components, complex business workflows, strict accessibility requirements, automated testing,
long-term maintainability, and incremental scaling.

---

## 1. Primary Goals

Build a React starter application with:

- Modern React
- Strict TypeScript
- Scalable architecture
- Feature-based organization
- Accessible UI
- Strong security defaults
- Excellent performance
- Comprehensive testing infrastructure
- Consistent coding standards
- Robust error handling
- Observability hooks
- Developer experience suitable for a large engineering team
- Clear separation between application, domain, infrastructure, and UI concerns
- Easy onboarding for new developers
- Minimal unnecessary dependencies

Prefer **simple, boring, well-understood solutions** over excessive abstractions.

Do not introduce abstractions unless they solve a real scalability problem.

---

# 2. Technology Stack

Use the latest stable versions available at the time of implementation.

Before making technology choices, verify compatibility between the selected versions.

Use:

- React
- TypeScript
- Vite
- React Router
- ESLint
- Prettier
- Vitest
- React Testing Library
- Playwright
- axe-core / jest-axe or equivalent accessibility testing
- MSW for API mocking
- Zod or an equivalent runtime schema validation library

For state management:

- Prefer React built-in state and context for local/simple state.
- Use a lightweight server-state solution such as TanStack Query for API/server state.
- Do NOT introduce Redux unless there is a demonstrated need for complex global client state.
- Clearly distinguish:
  - UI state
  - server state
  - URL state
  - form state
  - application state

For forms:

- Use React Hook Form where forms are sufficiently complex.
- Use native React state for simple forms.

For styling:

Choose one modern, scalable styling strategy and explain why it was selected.

The styling system must support:

- design tokens
- theming
- responsive layouts
- dark mode
- high contrast
- reduced motion
- component variants
- maintainable CSS
- accessibility

Do not introduce a large UI component library simply to demonstrate components.

---

# 3. Architecture

Use a **feature-oriented architecture** rather than organizing the entire application by technical
type.

Prefer a structure similar to:

src/ app/ router/ providers/ layouts/ config/ bootstrap/

features/ example/ components/ hooks/ services/ api/ models/ schemas/ pages/ utils/ **tests**/

components/ ui/ layout/ feedback/ navigation/

lib/ http/ auth/ logging/ analytics/ accessibility/ storage/

hooks/

services/

types/

utils/

styles/

assets/

tests/

Explain which responsibilities belong in each directory.

Avoid creating a giant `components/` folder containing every application component.

---

# 4. Dependency Rules

Establish clear dependency boundaries.

For example:

UI components ↓ Feature components ↓ Feature services/API ↓ Infrastructure

Do not allow:

- UI components importing feature internals unnecessarily
- API code importing UI code
- business logic depending on browser-specific implementation
- circular dependencies
- random utility imports creating hidden coupling

Where practical, enforce architecture boundaries using ESLint.

Document the architectural rules.

---

# 5. TypeScript

Configure TypeScript for strict enterprise development.

Enable appropriate strict options such as:

- strict
- noImplicitAny
- strictNullChecks
- noUncheckedIndexedAccess
- exactOptionalPropertyTypes
- noImplicitOverride
- noFallthroughCasesInSwitch
- useUnknownInCatchVariables

Avoid:

- `any`
- unnecessary type assertions
- `as unknown as`
- non-null assertions unless justified
- duplicated interfaces
- stringly typed APIs

Prefer:

- discriminated unions
- branded types where useful
- type-safe API models
- exhaustive switch handling
- readonly data where appropriate

Explain every TypeScript compiler option that materially affects architecture.

---

# 6. API Architecture

Create a centralized HTTP/API abstraction.

It should support:

- GET
- POST
- PUT
- PATCH
- DELETE
- request cancellation
- timeout handling
- authentication
- consistent error handling
- retries where appropriate
- request/response interceptors or middleware
- correlation/request IDs
- logging hooks
- typed responses
- runtime validation
- API error normalization

Do NOT scatter raw `fetch()` calls throughout components.

Example:

Component ↓ Feature hook ↓ Feature API/service ↓ HTTP client ↓ Backend

API responses should be validated at runtime where appropriate.

Never blindly trust server-provided data.

---

# 7. Authentication & Authorization

Create an architecture that can support:

- login
- logout
- session expiration
- token refresh
- protected routes
- role-based authorization
- permission-based authorization
- feature permissions
- unauthorized states

Do NOT put authentication tokens into localStorage unless there is a compelling reason.

Prefer secure browser/session mechanisms appropriate for the backend architecture.

Clearly separate:

Authentication: "Who is the user?"

Authorization: "What is the user allowed to do?"

Create reusable authorization primitives such as:

- ProtectedRoute
- PermissionGate
- RoleGate

But avoid making authorization purely a UI concern.

The backend remains the final authority.

---

# 8. Accessibility

Treat accessibility as a **first-class architectural requirement**, not a checklist added at the
end.

Target:

**WCAG 2.2 AA**

Follow:

- semantic HTML
- correct heading hierarchy
- keyboard navigation
- visible focus indicators
- accessible names
- accessible descriptions
- correct labels
- form error association
- screen-reader announcements
- appropriate ARIA usage
- correct landmark usage
- logical tab order
- focus management
- modal focus trapping
- escape handling
- accessible menus
- accessible dialogs
- accessible comboboxes
- accessible tables
- accessible loading states
- accessible error states
- accessible notifications
- reduced motion
- sufficient color contrast

Important rule:

**Prefer native HTML semantics over ARIA whenever possible.**

Do not use ARIA to compensate for incorrect HTML.

Examples:

Bad:

<div role="button">

Prefer:

<button>

Bad:

<div onclick="...">

Prefer:

<button>

Every interactive element must be keyboard accessible.

---

# 9. Accessibility Testing

Set up automated accessibility testing.

Include:

- component accessibility tests
- page-level accessibility tests
- Playwright accessibility checks
- axe-core integration

Create reusable test helpers.

Tests should detect:

- missing labels
- invalid ARIA
- insufficient semantic structure
- missing form associations
- invalid headings
- inaccessible buttons
- inaccessible dialogs
- color contrast issues where detectable
- keyboard navigation problems where practical

Also create a manual accessibility testing checklist covering:

- keyboard-only navigation
- screen reader
- focus management
- zoom
- reduced motion
- high contrast
- browser accessibility settings

Do not claim automated accessibility testing provides complete WCAG compliance.

---

# 10. UI Component Architecture

Create a small foundational UI system.

Start with components such as:

- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- FormField
- Label
- Alert
- Badge
- Tooltip
- Dialog
- Drawer
- Dropdown/Menu
- Tabs
- Accordion
- Spinner
- Skeleton
- EmptyState
- ErrorState
- Pagination

However:

**Do not build hundreds of components unnecessarily.**

Each component must have:

- clear API
- TypeScript types
- accessibility behavior
- keyboard support
- loading state where appropriate
- disabled state where appropriate
- error state where appropriate
- tests
- documentation/examples

Avoid prop explosion.

Prefer composable APIs when complexity increases.

---

# 11. Design System

Create design tokens for:

- colors
- spacing
- typography
- border radius
- shadows
- z-index
- breakpoints
- transitions
- focus indicators

Tokens should be centralized.

Avoid arbitrary values scattered throughout the codebase.

Support:

- light theme
- dark theme
- high contrast considerations
- reduced motion

Use CSS variables where appropriate.

---

# 12. Responsive Design

The application must work across:

- mobile
- tablet
- laptop
- desktop
- large screens

Do not create separate mobile and desktop applications.

Prefer responsive layouts.

Avoid:

- fixed widths where unnecessary
- horizontal scrolling caused by layout bugs
- inaccessible responsive navigation
- hover-only interactions

---

# 13. Performance

Design for enterprise-scale applications.

Address:

- code splitting
- lazy routes
- lazy components where appropriate
- bundle size
- tree shaking
- memoization only when justified
- virtualization for large lists
- image optimization
- caching
- request deduplication
- prefetching where useful
- rendering performance
- unnecessary re-renders
- Web Vitals

Do not blindly use `useMemo`, `useCallback`, or `memo`.

Explain when each optimization is justified.

---

# 14. Routing

Create a scalable routing architecture supporting:

- nested routes
- layouts
- protected routes
- lazy loading
- route-level error boundaries
- route metadata
- breadcrumbs
- 404
- unauthorized
- loading states

Prefer route definitions that remain maintainable when the application grows to hundreds of routes.

---

# 15. Error Handling

Implement layered error handling.

Include:

### Application-level errors

- global error boundary
- unexpected runtime errors

### Route-level errors

- route error UI

### API errors

Normalize backend errors into a consistent structure.

### Form errors

Display field-level validation errors.

### Network errors

Handle:

- offline
- timeout
- server unavailable
- authentication expiration

Do not expose sensitive technical information to end users.

Provide developer-friendly logging separately.

---

# 16. Loading States

Avoid blank screens.

Create reusable patterns for:

- initial loading
- skeleton loading
- button loading
- route loading
- lazy component loading
- background refresh
- optimistic updates

Loading indicators must be accessible.

Do not announce every trivial loading operation to screen readers.

---

# 17. Security

Follow frontend security best practices.

Address:

- XSS
- CSRF considerations
- token handling
- dependency vulnerabilities
- Content Security Policy
- iframe protection
- secure headers
- URL validation
- unsafe HTML
- DOM injection
- open redirects
- sensitive data exposure
- logging of sensitive information

Never use:

- `dangerouslySetInnerHTML`
- `eval`
- dynamically generated executable code

unless there is a very strong documented reason.

If `dangerouslySetInnerHTML` is required, sanitize content first.

---

# 18. Forms

Create a scalable form architecture.

Support:

- synchronous validation
- asynchronous validation
- server validation
- field-level errors
- form-level errors
- accessible error messages
- touched/dirty states
- submission states
- reset
- cancellation

Ensure every validation error is associated with its corresponding field.

---

# 19. State Management

Define strict rules.

### Local UI state

Use React state.

### Server state

Use TanStack Query or equivalent.

### URL state

Use router/search params.

### Form state

Use React Hook Form where appropriate.

### Global client state

Use Context or another state library only when genuinely required.

Do not put everything into a global store.

Document these rules in the project.

---

# 20. Testing Strategy

Create a testing pyramid.

### Unit tests

Test:

- utilities
- business logic
- hooks
- state transformations

### Component tests

Test:

- behavior
- accessibility
- user interaction

Do NOT over-test implementation details.

### Integration tests

Test:

- feature workflows
- API interaction
- forms
- error handling

### E2E tests

Use Playwright for critical user journeys.

Examples:

- authentication
- navigation
- CRUD workflow
- form submission
- permission behavior

### Accessibility tests

Integrate axe-core.

---

# 21. Mocking

Configure MSW for API mocking.

Mocks should support:

- success
- validation error
- unauthorized
- forbidden
- not found
- server error
- timeout
- network failure
- slow response

Do not make tests dependent on real backend services.

---

# 22. Code Quality

Configure:

- ESLint
- Prettier
- TypeScript strict checking
- import ordering
- unused imports
- accessibility linting
- React-specific linting
- hooks linting
- complexity checks where useful

Prefer ESLint rules that prevent architectural problems rather than enforcing arbitrary style.

---

# 23. Git Hooks / CI

Provide a CI-ready configuration.

Pipeline should include:

1. install dependencies
2. type checking
3. lint
4. unit tests
5. build
6. accessibility tests
7. E2E tests where appropriate
8. dependency/security checks

Configure pre-commit checks for fast feedback.

Do not make local development painfully slow.

---

# 24. Environment Configuration

Create a type-safe configuration layer.

Support:

- development
- test
- staging
- production

Never scatter:

```ts
import.meta.env;
```

throughout the application.

Create a central configuration abstraction.

Validate required environment variables at startup.

Never commit secrets.

Remember:

**Frontend environment variables are not secrets.**

Anything shipped to the browser can ultimately be inspected by users.

---

# 25. Logging & Observability

Create an abstraction for:

- debug logging
- warnings
- errors
- API failures
- user/session correlation
- performance metrics

Do not scatter `console.log()` throughout production code.

Allow logging behavior to differ between development and production.

Create extension points for tools such as:

- Sentry
- OpenTelemetry
- application analytics

Do not hard-code a vendor unnecessarily.

---

# 26. Internationalization

Prepare the architecture for i18n even if the starter application initially contains only English.

Consider:

- translation keys
- pluralization
- date formatting
- number formatting
- currency
- RTL languages
- dynamic text expansion

Do not concatenate user-visible strings in ways that make translation difficult.

---

# 27. Date / Number / Currency Handling

Do not manually format dates or currencies throughout the application.

Create standardized formatting utilities.

Prefer `Intl` APIs or a well-supported library where necessary.

Handle:

- timezone
- locale
- currency
- number formatting

Explicitly document timezone assumptions.

---

# 28. Browser Compatibility

Define the supported browser matrix.

Configure the build accordingly.

Do not add polyfills blindly.

Document browser support.

---

# 29. Documentation

Create:

README.md

ARCHITECTURE.md

ACCESSIBILITY.md

SECURITY.md

TESTING.md

CONTRIBUTING.md

CODING_STANDARDS.md

Each should explain the actual architecture and rules of the repository.

README should include:

- prerequisites
- installation
- development
- testing
- production build
- environment configuration
- project structure
- architectural principles

---

# 30. Example Feature

Create one small but realistic example feature to demonstrate the architecture.

For example:

`Users`

The feature should demonstrate:

- routing
- API service
- typed API models
- server state
- loading state
- error state
- empty state
- pagination
- filtering
- form validation
- accessible UI
- permissions
- unit tests
- integration tests
- Playwright test
- accessibility test

Keep the example simple enough to understand.

The purpose is to demonstrate architecture, not business complexity.

---

# 31. Developer Experience

Provide useful npm scripts such as:

- dev
- build
- preview
- lint
- lint:fix
- typecheck
- test
- test:watch
- test:coverage
- test:e2e
- test:a11y
- format
- format:check

Make the first-run experience straightforward.

---

# 32. Architecture Decision Records

Create an `docs/adr/` directory.

Document important decisions such as:

- why Vite
- why the chosen state-management approach
- why the styling solution
- why the folder structure
- why the API architecture
- accessibility strategy
- authentication strategy

Each ADR should explain:

- context
- decision
- alternatives
- consequences

---

# 33. Important Engineering Principles

Follow these principles throughout the implementation:

1. Accessibility is a requirement, not an enhancement.
2. Security boundaries must exist independently of UI behavior.
3. Prefer composition over inheritance.
4. Prefer native browser capabilities over custom implementations.
5. Prefer simple abstractions.
6. Avoid premature optimization.
7. Avoid premature abstraction.
8. Keep components focused.
9. Keep business logic out of presentation components.
10. Keep API logic out of UI components.
11. Keep server state separate from client state.
12. Make dependencies explicit.
13. Make failures predictable.
14. Make loading and error states first-class.
15. Design for keyboard and screen-reader users.
16. Favor type safety.
17. Favor testable code.
18. Avoid hidden global state.
19. Avoid circular dependencies.
20. Optimize for long-term maintainability rather than short-term development speed.

---

# 34. Things You MUST NOT Do

Do not:

- create a toy architecture
- put everything in `App.tsx`
- create a giant global store
- put API calls directly inside UI components
- use `any` casually
- use localStorage for sensitive authentication tokens without justification
- use arbitrary `div` elements for interactive controls
- overuse ARIA
- ignore keyboard accessibility
- rely exclusively on automated accessibility tests
- add unnecessary dependencies
- create abstractions without a clear reason
- overuse React Context
- overuse memoization
- create a huge component library before it is needed
- duplicate API models unnecessarily
- mix server state and UI state
- swallow errors
- expose sensitive errors to users
- hard-code environment-specific URLs
- commit secrets
- use real APIs in unit tests
- test implementation details unnecessarily

---

# 35. Implementation Process

Work in phases.

### Phase 1 — Architecture

Before writing code:

1. Explain the architecture.
2. Explain the technology choices.
3. Show the complete folder structure.
4. Explain dependency boundaries.
5. Explain state-management strategy.
6. Explain accessibility strategy.
7. Explain testing strategy.
8. Identify important trade-offs.

### Phase 2 — Foundation

Implement:

- Vite
- React
- TypeScript
- routing
- configuration
- styling
- linting
- formatting
- testing
- error boundaries
- API infrastructure
- accessibility infrastructure

### Phase 3 — UI foundation

Implement a small set of accessible primitives.

### Phase 4 — Example feature

Implement the Users feature.

### Phase 5 — Testing

Add:

- unit tests
- component tests
- integration tests
- accessibility tests
- E2E tests

### Phase 6 — Documentation

Create the documentation and ADRs.

### Phase 7 — Final review

Perform a Staff Engineer-level review.

Look specifically for:

- architectural weaknesses
- accessibility issues
- security issues
- performance problems
- unnecessary dependencies
- poor abstractions
- testing gaps
- TypeScript weaknesses
- scalability problems

Fix the problems you find.

---

# 36. Output Requirements

Do NOT immediately dump hundreds of files.

First provide:

## A. Architecture overview

Explain the proposed architecture.

## B. Technology decisions

Provide a table:

| Area          | Choice | Reason |
| ------------- | ------ | ------ |
| Build         | ...    | ...    |
| Routing       | ...    | ...    |
| Server state  | ...    | ...    |
| Forms         | ...    | ...    |
| Styling       | ...    | ...    |
| Testing       | ...    | ...    |
| Accessibility | ...    | ...    |

## C. Folder structure

Show the complete structure.

## D. Dependency rules

Explain what can import what.

## E. Implementation plan

Break implementation into logical steps.

Then implement the application incrementally.

For every major architectural decision, explain:

- Why it exists
- What problem it solves
- What alternatives were rejected
- How it scales

---

# 37. Quality Bar

Assume this repository will eventually be used by:

- 50+ frontend engineers
- multiple feature teams
- hundreds of routes
- thousands of UI components
- multiple backend services
- strict enterprise security requirements
- WCAG 2.2 AA compliance requirements

Design accordingly.

At the same time, **do not over-engineer the initial application**.

The starter should be small enough that a developer can understand the architecture within a few
hours, while having clear extension points for future complexity.

Your final implementation should feel like a **professional enterprise frontend platform**, not a
generated React tutorial.
