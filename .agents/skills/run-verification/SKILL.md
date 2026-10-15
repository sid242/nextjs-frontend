---
name: run-verification
description: >-
  Run the full quality and verification suite for the Next.js frontend foundation,
  including Prettier code style check, TypeScript strict typecheck, ESLint architectural rules, Vitest tests, and Turbopack production build.
---

# Frontend Verification Workflow

Use this skill when verifying code health, running CI checks locally, or investigating build and lint errors.

## 1. Automated Comprehensive Verification

To run all quality gates at once:

```bash
npm run check
```

This runs four sequential checks:

1. `npm run format:check` — Validates all files adhere to Prettier style and Tailwind CSS class ordering.
2. `npm run typecheck` — Runs `tsc --noEmit` under strict TypeScript rules.
3. `npm run lint` — Runs ESLint flat config with Next.js Core Web Vitals and downward import boundaries.
4. `npm run test` — Executes the Vitest test suite.

---

## 2. Resolving Common Issues

### Prettier Formatting Failures:

If formatting fails, auto-format the entire project:

```bash
npm run format
```

### ESLint Violations:

If linting fails:

- Try auto-fixing autofixable issues:
  ```bash
  npm run lint:fix
  ```
- **Deep Feature Import Violation**: If an error says `Import from a feature's public API (@/features/<name>), not its internals`, update the import to use the barrel:
  ```typescript
  // Bad:
  import { useFiles } from "@/features/files/queries";
  // Good:
  import { useFiles } from "@/features/files";
  ```
- **Layer Boundary Violation**: If an atom/molecule imports from an organism or a feature, refactor to pass the component via slots or props.

### Unit Test Failures:

Run Vitest in watch mode to debug specific tests:

```bash
npx vitest run src/path/to/failing.test.ts
```

---

## 3. Production Build Validation

Before finalizing any major feature, verify the standalone Turbopack production build:

```bash
npm run build
```

Verify that all routes compile and the output is generated in `.next/standalone`.
