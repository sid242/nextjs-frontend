# Workspace Rules — Next.js Frontend Foundation

See [AGENTS.md](./AGENTS.md) for full architecture and engineering guidelines.

## Non-Negotiable Rules

1. **Architecture Boundaries**:
   - Imports must point **downwards only**: `app -> features -> components (organisms -> molecules -> ui) -> lib / config`.
   - Never deep-import feature internals: use `@/features/<feature-name>`.
   - Lower layers (`components/`, `lib/`, `config/`) must never import `features/` or `app/`.
   - `components/ui/` (atoms) must never import from molecules or organisms.
2. **Client vs Server Separation**:
   - `src/lib/api/http.ts` is `client-only` (Axios). Never use it in Server Components.
   - Server Components and BFF API route handlers use `backendFetch` (`server-only`).
3. **Verification Before Completion**:
   - Always run `npm run check` (runs `format:check`, `typecheck`, `lint`, and `test`) and ensure 0 errors.
   - Run `npm run format` after generating new code.
4. **Git Commits**:
   - Conventional Commits enforced (`feat:`, `fix:`, `chore:`, etc.).
5. **Defensive Coding & Null-Safety**:
   - Always use optional chaining (`?.`) when accessing object properties or calling operations on arrays (`obj?.prop`, `arr?.map(...)`, `arr?.length`, `e?.target?.value`).
   - Pair with nullish coalescing (`??`) to avoid runtime crashes from `undefined` or `null` data.
6. **Named React Imports**:
   - Never use `import * as React from "react"`.
   - Always use named imports and explicit type imports (`import { useState, useRef, type ReactNode, type Ref } from "react"`).
7. **Permission-Driven UI & RBAC Gating**:
   - Never show navigation items, routes, or action buttons (create, edit, delete, suspend, invite) if the user lacks the required permission.
   - Filter sidebar navigation dynamically using `hasPlatformPermission` or `hasTenantPermission`.
   - Gate full pages with `<PlatformPermissionGate />` or `<TenantPermissionGate />`. Direct URL access without permission must display a clear "Access Restricted" alert card with the active role and required capability.
   - Map platform endpoints (e.g. `/platform/*`, `/plans/platform*`) to `platform_staff_token` in BFF proxy, and redirect platform 401s to `/platform/login` without triggering tenant refresh tokens.
8. **Tailwind CSS v4 Continuous Scale & BrixUI Foundations**:
   - **Zero Arbitrary Pixel Policy**: Tailwind CSS v4 supports a continuous numeric scale where any integer multiple of 4px (`0.25rem`) or half-step (`0.125rem` = 2px) is a native class. Never write arbitrary bracket pixels when a native utility exists (e.g., use `w-45 min-w-40` instead of `w-[180px] min-w-[160px]`, `w-24 min-w-24` instead of `w-[90px] min-w-[90px]`, `rounded-4xl` instead of `rounded-[32px]`).
   - Use arbitrary brackets (`[...]`) strictly for values not divisible by 4px/2px or dynamic CSS functions (`calc(...)`).
   - Adhere to the BrixUI Design System foundations (`.agents/rules/brix-design-foundation.md`) for typography hierarchy, responsive 12-col grids, 40px standard component sizing (`h-10 rounded-xl`), and sub-pixel border elevations.
9. **Cohesive State Grouping (No Fragmented States)**:
   - Never create separate, fragmented `useState` hooks for properties belonging to the same logical domain or operation.
   - Consolidate pagination (`{ page, pageSize }`), filters (`{ search, category, status }`), and sorting into cohesive state objects.
   - Consolidate modal operations (`{ isOpen, item, email, phone, step }`) into a single state object instead of scattered open booleans and target item states. Follow `.agents/rules/cohesive-state.md`.
