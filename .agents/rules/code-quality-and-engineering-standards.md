# Code Quality & Engineering Standards — Frontend Rule

This rule governs all code changes in `next-frontend-foundation`. All agents and developers must strictly follow these engineering standards.

## 1. Non-Negotiable Core Principles

1. **Audit Before Modifying**: Understand existing architecture, dependencies, and component boundaries before editing.
2. **Strict Type Safety — Zero `any`**:
   - Never introduce `any` or `as any`.
   - Use `unknown` at untrusted boundaries (API responses, external events) and parse with Zod schemas.
   - Do not use `@ts-ignore`, `@ts-nocheck`, or blanket `eslint-disable` comments to bypass checks.
   - Avoid non-null assertions (`!`). Prove existence with guard clauses or safe fallbacks.
3. **Downward-Only Architectural Boundaries**:
   - `app/` (routes) -> `features/` -> `components/` (organisms -> molecules -> ui) -> `lib/` & `config/`.
   - External callers must only import from a feature's public barrel `@/features/<feature-name>`. Never deep-import feature internals.
   - Lower layers (`components/`, `lib/`, `config/`) must never import from `features/` or `app/`.
4. **Server vs. Client Components**:
   - Default to React Server Components (RSC).
   - Add `'use client'` only where browser APIs, event listeners, or local interactive UI state are mandatory.
   - Keep client boundaries as low and narrow in the component tree as possible.
   - Never import server-only modules, DB code, or secret environment variables into Client Components (`client-only` vs `server-only`).
5. **Data Fetching & State Boundaries (TanStack Query vs Zustand)**:
   - Server state belongs strictly in TanStack Query (`queryOptions`, query key factories). Never duplicate server cache into Zustand.
   - Zustand is strictly for client-owned UI state, transient workflow state, or cross-component client interactions.
   - Clear tenant/user queries on logout or tenant switch to prevent cross-account cache leakage.
6. **Forms & Mutations**:
   - Colocate form controls in `src/components/molecules/forms/<control-name>/` following controlled + form-wrapped pattern.
   - Validate with Zod schemas and infer TypeScript types with `z.infer`.
   - Handle loading/pending states, server error messages, and prevent double submissions.
7. **Control Flow & Defensive Coding**:
   - Use **guard clauses** for early returns.
   - Use **lookup objects** (`statusConfig satisfies Record<...>` or `Map`) for static UI mappings, badges, and icon lookups.
   - Use **`switch` with exhaustive checks** for distinct state-driven UI variants.
   - Avoid nested ternaries and unsafe `value && <Component />` patterns where `value` could be `0` or `""`.
   - Use `??` for intentional defaults, preserving valid `0` and `""`.
8. **Tailwind CSS v4 & BrixUI Foundation**:
   - Continuous numeric scale: zero arbitrary bracket pixels when a native utility exists (e.g. `w-45` instead of `w-[180px]`).
   - Form inputs and triggers adhere to `h-10 rounded-xl`.
9. **Accessibility & User Feedback**:
   - Every interactive control must have accessible labels (`aria-label` or `<Label>`), focus visible styles, and keyboard support.
   - Always provide loading (skeleton), error, empty, and retry states.
10. **Verification Gate**:

- Run `npm run check` (or `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run test`) before committing or declaring completion.
