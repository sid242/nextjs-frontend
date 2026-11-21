# Frontend Engineering Standards — Next.js 16, React 19, TypeScript, Tailwind v4

Repository: `sid242/nextjs-frontend`

## 1. First inspect current framework documentation

This repository uses Next.js 16 and React 19. Read the documentation installed with the exact lockfile-resolved version before coding, especially for changed/deprecated APIs. Also check current official Next.js, React, Tailwind CSS and shadcn/ui docs. Do not rely on training-data assumptions.

## 2. Server and Client Components

- Default to Server Components.
- Add `'use client'` only where browser APIs, event handlers, local interactive state or client-only libraries are required.
- Keep client boundaries as low and narrow as possible.
- Never import server-only secrets, DB access, server auth helpers or server-only modules into client components.
- Use `server-only` for sensitive server modules where appropriate.
- Do not pass non-serializable values across the RSC boundary.
- Do not fetch the same data independently in multiple layers without a clear cache/query ownership strategy.
- Understand Next 16 caching and revalidation semantics from the installed docs; do not assume old defaults.
- Use framework navigation APIs appropriately; avoid `window.location` for same-origin navigation unless a full document navigation is intended.
- Validate redirect targets to prevent open redirects.

## 3. React component design

- Components should primarily render UI; move domain logic into feature hooks/services/utilities.
- Keep state minimal. Do not store values that can be derived from props or existing state.
- Avoid effects for derived state, event handling or data transformation.
- Effects synchronize with external systems; include correct dependencies and cleanup.
- Do not suppress exhaustive-deps without a documented reason.
- Avoid defining unstable objects/functions inline when they cause measurable re-render or query-key issues; do not prematurely memoize everything.
- Use `useMemo`/`useCallback` only when they provide a real referential/performance benefit or are required by an API contract.
- Use stable keys; never use array index for reorderable lists.
- Avoid giant components. Extract meaningful components, not one-line wrappers.
- Use controlled/uncontrolled inputs consistently and preserve accessible labels.
- Avoid `React.FC` dogma; follow consistent project style.
- Prefer explicit event and prop types inferred from React primitives where appropriate.

## 4. Conditional rendering and mappings

Use a lookup map for static label/icon/config mappings:

```tsx
const statusConfig = {
  active: { label: "Active", className: "text-green-700" },
  pending: { label: "Pending", className: "text-amber-700" },
  suspended: { label: "Suspended", className: "text-red-700" },
} satisfies Record<UserStatus, { label: string; className: string }>;

const config = statusConfig[user.status];
return <Badge className={config.className}>{config.label}</Badge>;
```

Use `switch` for finite state-dependent rendering when cases have distinct markup/behavior. Use guard clauses for early returns. Avoid nested ternaries and duplicated conditions.

Do not use `value && <Component />` when `value` may be `0` or `''` and that value could render accidentally. Prefer explicit booleans.

## 5. Data fetching — TanStack Query

- Server state belongs in TanStack Query, not duplicated into Zustand.
- Centralize query key factories and keep keys serializable and deterministic.
- Use `queryOptions` where it improves reuse and type inference.
- Pass `AbortSignal` from query function to the API client.
- Define retry policy by error type; do not retry validation/authorization/most 4xx errors.
- Mutations must invalidate or update the correct keys.
- Use optimistic updates only when rollback and concurrency semantics are correct.
- Prevent stale data from flashing across tenant/user changes; include tenant/user identity in keys where relevant and clear caches on logout/account switch.
- Do not create a module-global QueryClient for SSR. Use a request-scoped server client and the intended client provider lifecycle.
- Handle loading, error, empty, stale and success states intentionally.
- Keep API functions framework-agnostic and typed; hooks compose query behavior.
- Do not duplicate server data in Zustand simply to share it between components.

## 6. API client and BFF

- Keep browser-only Axios instances marked client-only.
- Server components/route handlers should use the repository's approved server fetch/BFF mechanism.
- Normalize API errors into a typed shape.
- Preserve cancellation errors.
- Ensure refresh-token single-flight behavior and bounded retry; never create infinite 401 refresh loops.
- Do not log tokens, cookies or sensitive request/response bodies.
- Validate BFF input and upstream response contracts.
- Propagate request/correlation IDs.
- Avoid sending backend secrets to the browser.
- Make proxy allowlists explicit; prevent arbitrary URL proxying and SSRF.

## 7. Forms — React Hook Form + Zod + shadcn

- Use the existing `FormWrapper` and controlled form components where appropriate and consistent with repository `AGENTS.md`.
- Define a Zod schema close to the feature form and infer form types using `z.infer`.
- Separate input schema from API DTO only when their shapes/semantics differ.
- Normalize values intentionally (trim, empty-to-null, number parsing); do not silently coerce invalid input.
- Use `zodResolver` with the installed compatible version.
- Support server-side field errors, pending state, disabled submit, reset, async defaults and unsaved-change behavior.
- Avoid separate `useState` for every form field.
- Use `useFieldArray` for repeatable fields.
- Do not put long complex forms in dialogs. Follow the repository's documented page/dialog convention, but validate the threshold against actual UX and existing design system.
- Every control needs an accessible name, description and error association.
- Prevent duplicate submissions and handle idempotency where relevant.

## 8. shadcn/ui

- Follow the current official shadcn/ui installation and component guidance for the repository's selected styling/base primitive setup.
- shadcn components are source code in the app, not a black-box package. Treat them as owned components.
- Preserve customizations; do not regenerate/overwrite blindly.
- Prefer editing a local primitive when the change is truly global and desired everywhere. Use a wrapper for feature-specific behavior or a distinct API. Avoid unnecessary wrapper layers.
- Use `asChild`/composition only where supported by the underlying component and verify ref/event behavior.
- Ensure Radix/Base UI peer dependencies match the selected component generation.
- Keep variants typed and centralized with CVA where it helps.
- Do not build a second design system on top of shadcn without a clear need.

## 9. Tailwind CSS v4

- Follow v4 CSS-first configuration and installed plugin setup.
- Do not copy v3 `tailwind.config` patterns without verifying v4 support.
- Use design tokens/CSS variables for theme values; avoid scattered arbitrary colors.
- Use semantic component variants for repeated patterns.
- Keep responsive, hover, focus-visible, disabled and dark-mode behavior intentional.
- Avoid long duplicated class strings; extract a component/variant when a pattern repeats.
- Use `cn()` only for merging conditional classes; do not create nested `cn` complexity.
- Avoid dynamic class construction that Tailwind cannot statically detect. Use explicit maps of complete class strings.
- Keep class ordering formatter-managed; do not hand-sort against the configured plugin.

## 10. Zustand

- Use only for client-owned UI state or cross-component client workflows.
- Prefer small focused stores; do not create a global store for every feature.
- Select only needed state to reduce rerenders.
- Use actions for state transitions; avoid components mutating complex nested state ad hoc.
- Reset user/tenant-specific state on logout or tenant switch.
- Avoid module-global user state leaking across SSR requests.
- Do not store secrets or authoritative permissions in the browser.

## 11. Accessibility and UX

- Semantic HTML first.
- Keyboard navigation and visible focus are mandatory.
- Dialogs need focus trap, initial focus, Escape behavior and focus restoration.
- Menus, comboboxes and tables must meet expected keyboard semantics.
- Announce async validation and important status changes to assistive technology.
- Respect reduced motion and color contrast.
- Include skeleton/loading, error, empty and retry states.
- Do not use color alone to communicate status.

## 12. Performance

- Measure before optimizing.
- Keep client JS small; avoid marking whole layouts/providers as client unnecessarily.
- Use Next image/font facilities appropriately and specify dimensions/sizes.
- Lazy-load heavy editors/charts/monaco only when needed.
- Avoid N+1 API calls and unnecessary refetches.
- Virtualize only genuinely large lists.
- Check route bundle output and production build.
- Avoid overusing memoization and premature abstraction.

## 13. Frontend tests

- Unit-test pure functions and schema validation.
- Component tests should assert accessible behavior and user outcomes.
- Test loading/error/empty/success states.
- Test forms for invalid, valid, server-error, pending and duplicate-submit cases.
- Test query invalidation and tenant/user cache isolation.
- Add Playwright/E2E tests for auth, tenant switching, permissions and critical business flows if the repo supports it.
- Avoid snapshot-only tests for complex behavior.
