# AGENTS.md — Next.js Frontend Foundation Guidelines

Welcome agent! This file defines the core architecture, operational constraints, coding conventions, and verification procedures for the **Next.js Scalable Frontend Foundation**. Follow these rules whenever modifying or extending this codebase.

---

## 1. Tech Stack Overview

- **Framework**: Next.js 16 (App Router with Turbopack, standalone output)
- **Language**: TypeScript (strict mode, `noUncheckedIndexedAccess`, ES2017+)
- **Styling**: Tailwind CSS v4 with OKLCH theme variables and inline `@theme`
- **UI Components**: Radix UI primitives + shadcn/ui design tokens
- **Data Fetching**: TanStack Query v5 + Axios (client) / `backendFetch` (server)
- **Client State**: Zustand v5 (UI state only)
- **Forms & Validation**: React Hook Form + Zod v3
- **Realtime**: Socket.IO client v4
- **Testing**: Vitest v3
- **Tooling**: ESLint v9 (flat config), Prettier v3, Husky v9, lint-staged v17, Commitlint v21

---

## 2. Architecture & Boundary Rules (CRITICAL)

The codebase enforces strict **downward-only dependencies** through ESLint rules in `eslint.config.mjs`:

```text
src/app (routes)
  └── src/features (vertical slices)
        └── src/components (organisms -> molecules -> ui)
              └── src/lib & src/config
```

### Boundary Constraints:

1. **No Deep Feature Imports**:
   - Callers outside a feature MUST import only from the feature's public barrel: `@/features/<feature-name>`.
   - Never import internal paths like `@/features/<name>/queries` or `@/features/<name>/components/...`.
2. **Downward Imports Only**:
   - `components/`, `lib/`, and `config/` are lower layers and must **never** import from `features/` or `app/`.
   - When an organism needs feature UI, use slots or render props (e.g., `AppShell`'s `userMenu` slot).
   - `features/` must **never** import from `app/`.
3. **Atomic UI Hierarchy**:
   - `components/ui/` (atoms) must never import from molecules or organisms.
   - `components/molecules/` must never import from organisms.
4. **Client vs Server Code Separation**:
   - Client code (`src/lib/api/http.ts`) uses Axios and imports `client-only`. It must **never** be imported or executed in Server Components.
   - Server code (`src/lib/server/backend.ts`) uses `backendFetch` (Next's native `fetch`) and imports `server-only`.
   - In Next.js 16, request interception and routing gates live in `src/proxy.ts` (renamed from `middleware.ts`).

---

## 3. The Feature Module Pattern

Every capability in `src/features/<feature-name>/` should adhere to this uniform structure:

```text
src/features/<feature-name>/
├── api.ts              # Plain async functions returning data with AbortSignal support
├── keys.ts             # TanStack Query key factory objects (safe for server prefetch)
├── queries.ts          # queryOptions() factories + custom useQuery / useMutation hooks
├── schemas.ts          # Zod validation schemas & inferred TypeScript types
├── server.ts           # (Optional) Server-only prefetch functions for SSR hydration
├── components/         # Feature-specific components (tables, forms, dialogs, badges)
└── index.ts            # Public API: explicitly re-exports what routes need
```

### Data Layer Rules:

- **`api.ts`**: Pure functions, no React dependencies. Example:
  ```typescript
  export async function getFiles(signal?: AbortSignal): Promise<FileRecord[]> {
    return api.get<FileRecord[]>("/files", { signal });
  }
  ```
- **`keys.ts`**: Plain JavaScript objects or functions without React context:
  ```typescript
  export const fileKeys = {
    all: ["files"] as const,
    list: () => [...fileKeys.all, "list"] as const,
    detail: (id: string) => [...fileKeys.all, "detail", id] as const,
  };
  ```
- **`queries.ts`**: Export reusable `queryOptions` so Server Components can prefetch and client components can consume:
  ```typescript
  export const filesQueryOptions = () =>
    queryOptions({
      queryKey: fileKeys.list(),
      queryFn: ({ signal }) => getFiles(signal),
    });
  ```

---

## 4. Coding Conventions & Best Practices

- **Formatting**:
  - Run `npm run format` after any edits.
  - Double quotes (`"`), semicolons (`;`), 2 spaces indent, trailing commas (`"all"`), max print width 100.
- **Naming Conventions**:
  - Files & directories: `kebab-case.ts`, `kebab-case.tsx`
  - React Components: `PascalCase`
  - Hooks: `camelCase` starting with `use...`
  - Schema objects: `camelCase` ending in `...Schema` (e.g., `loginSchema`)
- **Error Handling**:
  - All client HTTP errors are mapped to `ApiError { status, code, message, details, requestId, retryAfter }`.
  - Use `getErrorMessage(error)` to display user-facing errors without leaking internal stack traces.
- **Environment Variables**:
  - Server environment variables are defined with Zod schema in `src/lib/server/env.ts` (`getEnv()`).
  - No secrets in `NEXT_PUBLIC_*` variables.

---

## 5. Verification Commands

Always run the full verification check before finalizing changes:

```bash
# One-stop verification (formatting, types, lint, tests)
npm run check

# Individual checks if needed:
npm run format:check   # Prettier verification
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint flat config
npm run test           # Vitest unit test suite
npm run build          # Standalone production Turbopack build
```

---

## 6. Commit Convention

All commit messages are validated by Commitlint:

- Format: `<type>(<optional scope>): <description>`
- Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`
- Example: `feat(files): add drag-and-drop batch upload component`
