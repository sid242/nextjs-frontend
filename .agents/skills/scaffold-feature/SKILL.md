---
name: scaffold-feature
description: >-
  Scaffold a new vertical feature slice in src/features/ following the project's strict architecture rules,
  including typed API functions, query key factories, TanStack Query hooks, Zod validation schemas, and public barrel exports.
---

# Feature Scaffolding Workflow

Follow this procedure whenever adding a new domain feature in `src/features/<feature-name>/`.

## 1. Directory Structure

Create the following files inside `src/features/<feature-name>/`:

```text
src/features/<feature-name>/
├── api.ts              # Typed Axios HTTP calls (client-only)
├── keys.ts             # TanStack Query keys factory
├── queries.ts          # TanStack Query hooks & queryOptions
├── schemas.ts          # Zod validation schemas and TypeScript types
├── server.ts           # (Optional) Server component prefetch functions
├── components/         # Feature-specific UI components
│   └── <feature>-list.tsx
└── index.ts            # Public barrel export
```

---

## 2. File Templates

### A. `schemas.ts`

Define validation schemas and export inferred types:

```typescript
import { z } from "zod";

export const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string(),
});

export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = itemSchema.pick({ name: true });
export type CreateItemInput = z.infer<typeof createItemSchema>;
```

### B. `api.ts`

Implement pure typed async functions using `api` from `@/lib/api/http`:

```typescript
import { api } from "@/lib/api/http";
import type { Item, CreateItemInput } from "./schemas";

export async function getItems(signal?: AbortSignal): Promise<Item[]> {
  return api.get<Item[]>("/items", { signal });
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  return api.post<Item>("/items", input);
}
```

### C. `keys.ts`

Create query key factories without React dependencies:

```typescript
export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  detail: (id: string) => [...itemKeys.all, "detail", id] as const,
};
```

### D. `queries.ts`

Create reusable `queryOptions` and mutation hooks:

```typescript
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getItems, createItem } from "./api";
import { itemKeys } from "./keys";
import type { CreateItemInput } from "./schemas";

export const itemsQueryOptions = () =>
  queryOptions({
    queryKey: itemKeys.lists(),
    queryFn: ({ signal }) => getItems(signal),
  });

export function useItems() {
  return useQuery(itemsQueryOptions());
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
```

### E. `index.ts` (Public API Barrel)

Export ONLY what external routes or pages need:

```typescript
export * from "./schemas";
export { itemKeys } from "./keys";
export { itemsQueryOptions, useItems, useCreateItem } from "./queries";
export { ItemList } from "./components/item-list";
// If server.ts exists: export * from "./server"; (for server components)
```

---

## 3. Boundary Verification

After creating the feature, run:

```bash
npm run check
```

Ensure no deep-import ESLint warnings occur (`@/features/<feature-name>/*` is forbidden outside the feature).
