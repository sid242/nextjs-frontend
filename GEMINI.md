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
