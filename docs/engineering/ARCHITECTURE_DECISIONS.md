# Architecture Decisions & Invariants — Frontend Repository

**Repository:** `sid242/nextjs-frontend` (`next-frontend-foundation`)

---

## 1. Architectural Invariants

### 1.1 Downward-Only Dependency Hierarchy

```
src/app (routes)
  └── src/features (vertical slices)
        └── src/components (organisms -> molecules -> ui)
              └── src/lib & src/config
```

- Public Feature Barrel: Callers outside a feature import exclusively from `@/features/<feature-name>`.
- Shared components, lib, and config never import from `features/` or `app/`.
- Atoms (`ui/`) and molecules never import from organisms.

### 1.2 Server & Client Separation

- Default to React Server Components (RSC).
- `'use client'` is used only when browser APIs or local interactive state is necessary.
- Server fetch (`src/lib/server/backend.ts`) uses `server-only` and Next native fetch.
- Client fetch (`src/lib/api/http.ts`) uses `client-only` and Axios.
- Request routing and security gates live in `src/proxy.ts`.

### 1.3 State Separation

- **TanStack Query**: Single source of truth for all asynchronous server state, cache invalidation, and data prefetching.
- **Zustand**: Strictly reserved for client-side ephemeral UI state and complex interactive workflows. Never duplicate server entities in Zustand.

### 1.4 BrixUI & Tailwind CSS v4 Scale

- Continuous numeric scale: arbitrary bracket pixels (`[...]`) are prohibited when divisible by 4px or 2px.
- Standard form inputs: `h-10 rounded-xl`.
