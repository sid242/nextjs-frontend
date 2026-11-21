# Dependency Audit & Modernization Policy — Frontend Repository

**Repository:** `sid242/nextjs-frontend` (`next-frontend-foundation`)  
**Audit Date:** 21 November 2026

---

## 1. Key Dependency Analysis & Compatibility Groups

| Package                 | Declared Version | Category                | Assessment & Action Plan                                                         |
| :---------------------- | :--------------- | :---------------------- | :------------------------------------------------------------------------------- |
| `next`                  | `^16.4.6`        | App Router Framework    | Next.js 16 with Turbopack and standalone build output. Compatible with React 19. |
| `react` / `react-dom`   | `^19.2.0`        | UI Library              | React 19 runtime. Synchronized with `@types/react ^19.2.0`.                      |
| `tailwindcss`           | `^4.1.0`         | Styling Engine          | Tailwind CSS v4 CSS-first configuration via `@tailwindcss/postcss ^4.1.0`.       |
| `radix-ui`              | `^1.4.3`         | Primitive Components    | Accessible UI primitives for shadcn/ui.                                          |
| `@tanstack/react-query` | `^5.90.0`        | Server State Management | TanStack Query v5 with `@tanstack/react-query-devtools ^5.90.0`.                 |
| `zustand`               | `^5.0.8`         | Client State Management | Zustand v5 for client UI state.                                                  |
| `react-hook-form`       | `^7.62.0`        | Form State              | Synchronized with `@hookform/resolvers ^5.2.0` and `zod ^3.25.0`.                |
| `vitest`                | `^3.2.0`         | Unit & Integration Test | Vitest v3 with Chai assertion library.                                           |
| `axios`                 | `^1.16.1`        | Client HTTP             | Client-only HTTP client; Server components use native `backendFetch`.            |
| `@sentry/nextjs`        | `^11.10.0`       | Observability           | Next.js Sentry instrumentation.                                                  |

---

## 2. Upgrade & Verification Guidelines

1. **Lockfile as Source of Truth**: All dependency modifications must be installed via `npm` to keep `package-lock.json` deterministic.
2. **Compatibility Groups**: Update Next.js + React + ESLint Config as an atomic group. Never update individual packages out-of-sync.
3. **No Breaking Changes Without Proof**: Run `npm run check` (format, typecheck, lint, test) before accepting any dependency update.
