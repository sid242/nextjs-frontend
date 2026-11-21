# Quality Backlog & Remediation Plan — Frontend Repository

**Repository:** `sid242/nextjs-frontend` (`next-frontend-foundation`)

---

## Prioritized Remediation Backlog

### P0 — Safety, Security & Correctness

- [ ] **Eliminate Last `any`**: Refactor `src/lib/query/hooks.ts:171` to use proper generic typing for `useMutation` options, eliminating the single `as any` cast.
- [ ] **Next Image Optimization**: Replace raw `<img>` tags flagged by ESLint with Next.js `<Image />` where appropriate (e.g. `src/features/platform/components/platform-shell.tsx:350`).

### P1 — Engineering Consistency & Strictness

- [ ] **Hook Dependency Warnings**: Remediate missing dependencies in `useEffect` and `useCallback`:
  - `src/app/(auth)/magic-link/page.tsx:58` (`searchParams`)
  - `src/features/files/use-upload-files.ts:111` (`folderId`)
- [ ] **Unused Import Cleanup**: Prune the 25+ unused variable warnings across feature components and queries.
- [ ] **React Compiler Compatibility**: Review `change-plan-dialog.tsx` `methods.watch` usage to support React Compiler optimizations.

### P2 — Polish & Performance

- [ ] **BrixUI Design Token Consistency**: Continue auditing component surfaces to ensure strict adherence to the continuous numeric scale (`w-45`, `h-10 rounded-xl`).
- [ ] **Route Bundle Optimization**: Ensure heavy third-party components (Monaco editor, TipTap, rich email editor) remain lazy-loaded with Next dynamic imports.
