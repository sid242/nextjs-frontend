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
8. **Tailwind CSS v4 Continuous Scale & Modern Standards**:
   - Prefer native continuous numeric scale utilities over arbitrary bracket syntax. Any integer multiple of 4px (`0.25rem`) is a native utility (e.g., use `min-h-105` instead of `min-h-[420px]`, `w-100` instead of `w-[400px]`, `max-w-120` instead of `max-w-[480px]`).
   - Use arbitrary brackets (`[...]`) only for values not divisible by 4px or for dynamic CSS functions (`calc(...)`).
   - Use modern v4 features: OKLCH color system, `@theme` tokens, native `@container` queries, and `text-wrap: balance/pretty`.
