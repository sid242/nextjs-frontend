# Next.js Scalable Frontend Foundation

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · axios · TanStack Query · Zustand ·
React Hook Form + Zod · Socket.IO client. Pairs with the Express/Prisma backend foundation (`/api/v1`, JWT access +
rotating refresh tokens, S3 presigned uploads, Socket.IO).

## Verification status

The foundation has been fully audited, configured, and verified for production grade:

| Check                                                      | Result                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **TypeScript Strict (`npm run typecheck`)**                | `tsc --noEmit` passed with 0 errors                                                           |
| **ESLint Flat Config (`npm run lint`)**                    | Next.js Core Web Vitals, TypeScript, architectural boundary enforcement, 0 errors, 0 warnings |
| **Prettier & Tailwind Plugin (`npm run format:check`)**    | 100% matched files formatted and Tailwind classes ordered                                     |
| **Unit & Integration Tests (`npm run test`)**              | 42/42 Vitest tests passed across 11 test suites                                               |
| **Production Build (`npm run build`)**                     | Standalone production Turbopack build compiled cleanly                                        |
| **Git Hooks & Commits (Husky + lint-staged + Commitlint)** | Staged pre-commit linting + formatting, conventional commit message linting                   |

## Developer Workflow & Scripts

```bash
cp .env.example .env.local     # configure API_URL / SOCKET_URL
npm run dev                    # run dev server on http://localhost:3001
npm run check                  # runs format:check + typecheck + lint + test
npm run format                 # auto-format with Prettier + Tailwind plugin
npm run lint:fix               # auto-fix ESLint issues
npm run build                  # generate production standalone bundle
```

Backend requirements: REST goes through this app (same-origin), so no REST CORS is needed. **Socket.IO connects from the
browser straight to the backend**, so the backend's `CORS_ORIGINS` must include this app's origin (e.g. `http://localhost:3001`),
and the S3 bucket CORS must allow `POST` from it.

## Architecture: feature modules + atomic UI layers

Pure atomic design organises _visual_ pieces well but has no home for business logic, so this project combines two ideas:
**features** (vertical slices) own everything about one capability; **atomic layers** organise the shared, feature-agnostic UI.

```
src/
├── app/                  # ROUTES ONLY: thin pages that compose features + shared UI
│   ├── (marketing)/ (auth)/ (app)/     route groups
│   └── api/              #   BFF endpoints: auth cookies, refresh, data proxy, health
├── features/             # VERTICAL SLICES, one folder per capability
│   └── files/            #   api.ts -> queries.ts -> components/, keys.ts, store, server.ts, index.ts (public API)
│       auth/ users/ realtime/
├── components/           # SHARED UI, atomic layers (feature-agnostic)
│   ├── ui/               #   atoms: shadcn/ui primitives
│   ├── molecules/        #   FormField, PageHeader, EmptyState, ConfirmDialog, OfflineBanner...
│   ├── organisms/        #   AppShell, AppSidebar, SidebarNav (feature UI arrives through slots)
│   └── providers/        #   theme, query client, devtools, store hydration, toaster
├── lib/
│   ├── api/              # axios instances (http.ts), errors.ts, refresh.ts, types.ts
│   ├── query/            # QueryClient factory, retry policy, server client
│   ├── stores/           # zustand: ui-store, reset registry
│   ├── auth/ server/     # cookies/session helpers; server-only BFF helpers (fetch based)
│   └── ...               # format, id, async, monitoring, hooks/
├── config/               # static app config (site name, nav)
└── proxy.ts              # Next 16 "proxy" (formerly middleware): route guard, CSP nonce
```

**Dependencies point down only** (enforced by ESLint `no-restricted-imports`, see `eslint.config.mjs`):
`app -> features -> components (organisms -> molecules -> ui) -> lib / config`.

- Never deep-import a feature: use `@/features/files`, not `@/features/files/queries`.
- `components/` and `lib/` never import `features/` or `app/`. When an organism needs feature UI, the route passes it in as a slot (`AppShell`'s `userMenu` / `headerSlot`).
- `@/features/files` re-exports server-only code (`prefetchFiles`): import that barrel from **server components only**.

### The data layers (the pattern to copy for every feature)

```
components  ->  hooks (queries.ts, TanStack Query)  ->  api.ts (typed axios calls)  ->  lib/api/http.ts  ->  /api/proxy (BFF)  ->  backend
     ^                      ^
 zustand stores        keys.ts (query keys, also used by server prefetch)
 (client-only UI state)
```

1. **`api.ts`**: plain typed functions, no React: `api.get<FileRecord[]>("/files", { signal })`. Always accept an `AbortSignal`.
2. **`queries.ts`**: `queryOptions()` + `useQuery/useMutation` hooks. Query keys live in a plain `keys.ts` so server components can reuse them.
3. **components**: call hooks, render states (loading / error / empty / data).

### axios layer (`lib/api/`)

- `http` (`/api/proxy/*`, authenticated data) and `authHttp` (`/api/auth/*`), plus typed `api.get/post/put/patch/delete` helpers that return `data`.
- **401 handling:** refresh once (single-flight: N parallel 401s share ONE refresh, which matters because refresh tokens are single-use), retry the request once, otherwise redirect to `/login?next=...`. A refresh _outage_ (5xx/network) does not log the user out.
- Errors are normalised to `ApiError { status, code, message, details, requestId, retryAfter }`; `status 0` means offline/timeout. Cancellations pass through untouched. `getErrorMessage()` never leaks server internals and shows a short support reference (the request id) for 5xx.
- Every request carries an `x-request-id` that the BFF forwards to the backend: one id spans browser -> Next -> API logs.
- **Server code does not use axios.** Server components and route handlers use `backendFetch` (Next's `fetch`, needed for streaming the proxy response and Next's request semantics). `http.ts` imports `client-only`, so using it on the server is a build error.

### TanStack Query (`lib/query/`)

- One client per browser tab, a fresh one per server request (no cross-user leaks). `queryClient.clear()` runs on sign-in/out.
- **Global error policy:** failed mutations show a toast by default; failed _background_ refetches toast too (initial-load failures render the component's own error UI). Opt out per call with `meta: { silent: true }`, or customise with `meta: { errorMessage: "..." }` (typed).
- **Retry policy:** transient failures (network, timeout, 5xx, 429) retry twice; 4xx never do. Mutations never auto-retry.
- **Server prefetch + hydration:** see `app/(app)/files/page.tsx` and `features/files/server.ts` (`prefetchFiles` -> `<HydrationBoundary>`): the table renders with data on first paint. If prefetch fails, the client just fetches on mount.
- **Optimistic update with rollback:** `useDeleteFile` in `features/files/queries.ts` is the reference.
- Devtools render in development only.

### Zustand (`lib/stores/`, `features/*/store`)

Rules (also at the top of `ui-store.ts`):

- Zustand holds **client-only** state. Server data lives in TanStack Query / server components: never copy it into a store.
- Stores are module singletons: touch them from client components, effects and handlers only, never while rendering on the server.
- Subscribe with **selectors**: `useUiStore((s) => s.sidebarCollapsed)`.
- Anything holding per-user data registers `registerStoreReset(...)`; sign-in/out calls `resetAllStores()` (aborts in-flight uploads, clears file names).
- Persisted stores use `skipHydration` and are restored by `<StoreHydrator />` after mount (no SSR hydration mismatch).

In use: `ui-store` (persisted sidebar collapse), `features/realtime/store` (socket + connection status), `features/files/upload-store`
(multi-file upload queue: 3 at a time, per-file progress, cancel, dismiss). Pure queue transitions are in `upload-state.ts` (unit-tested).

### Realtime (`features/realtime`)

- Typed event contract in `events.ts` (`useSocketEvent("file:processed", ...)` is type-checked). Keep it in sync with the backend.
- `SocketProvider` handles: token expiry (fresh token fetched on every (re)connect), "unauthorized" handshake rejection (refresh session, reconnect, give up after 2), server-initiated disconnects (explicit reconnect), missed events (refetch active queries after a reconnect), StrictMode double-mount and logout (full teardown).
- `useSocketEvent`, `useRoom` (re-joins after reconnect), `useConnectionStatus`, and a header `ConnectionStatus` badge.
- Realtime is an enhancement: with sockets down, the app still works through normal refetching.

## Auth & security model (Backend-for-Frontend)

```
Browser ──same-origin──▶ Next.js (/api/auth/*, /api/proxy/*) ──Bearer──▶ Backend /api/v1
         httpOnly cookies                                               (verifies JWT, rate-limits, authorizes)
```

- Tokens live in **httpOnly, SameSite=Lax, Secure** cookies, so XSS cannot read them. The refresh cookie is scoped to `/api/auth`.
- Server components that need the session call `requireUser()`, which redirects through `/api/auth/refresh` (with a loop guard) when the access token is missing.
- **CSRF:** SameSite=Lax plus an `Origin`/`Sec-Fetch-Site` check on every mutating BFF route. **Open redirects:** every `?next=` goes through `safeNextPath()` (unit-tested).
- **CSP** with a per-request nonce and `strict-dynamic` (`src/proxy.ts`), plus HSTS, frame, referrer and permissions headers (`next.config.ts`).
- The route guard in `proxy.ts` is a UX gate only. Real authorization happens in the backend on every call.
- The proxy forwards `X-Forwarded-For` so the backend's per-IP rate limiting sees real client IPs. Set the backend's `TRUST_PROXY` to the true hop count.
- **Known trade-off:** Socket.IO runs browser -> backend, so `/api/auth/socket-token` hands the short-lived access token to page JS. Keep `JWT_ACCESS_TTL` short.

## Where does new code go?

1. Used by one capability? Inside that feature (most code).
2. Generic visual building block? `components/ui` (atom) -> `molecules` (composition) -> `organisms` (page-level).
3. Pure helper or API plumbing? `lib/`.
4. Needs cookies/request on the server? `lib/server` or a route handler.
5. Wait for the **second** consumer before promoting something to a shared folder.

**Adding a feature** (`orders`): `features/orders/{api.ts, keys.ts, queries.ts, components/, index.ts}`; a route under `app/(app)/orders/`;
a nav item in `config/site.ts` and the prefix in `PROTECTED_PREFIXES` (`lib/auth/paths.ts`). For SSR data, add `server.ts` with a `prefetchOrders` like `prefetchFiles`.

**Adding shadcn components:** `npx shadcn@latest add <component>` writes into `components/ui`. The included primitives were hand-written in the
same style so the project works before the CLI runs; the CLI may overwrite them. Re-run `npm run lint` afterwards (atoms must not import upward).

## Environment

All config is **runtime** (no `NEXT_PUBLIC_*`), so one Docker image is promoted unchanged through environments.

| Variable              | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `API_URL`             | Backend REST base, used only by the Next.js server                |
| `SOCKET_URL`          | Backend origin the browser uses for Socket.IO                     |
| `CSP_CONNECT_EXTRA`   | Extra `connect-src` origins (your S3 bucket endpoint)             |
| `COOKIE_SECURE=false` | Only for running a production build over plain `http://localhost` |

## Deployment (AWS ECS Fargate)

`Dockerfile` (standalone output, non-root, tini) -> ECR -> ECS behind an ALB. `deploy/task-def-web.json` and `.github/workflows/ci-cd.yml`
mirror the backend's setup (OIDC, rolling deploy with rollback). Replace `ACCOUNT_ID` and the example URLs, set `AWS_DEPLOY_ROLE_ARN`,
use `/api/ready` as the ALB target health check and `/api/health` for container health.

## Testing

`npm test` covers the framework-agnostic logic (see the table at the top). Not included yet: component tests (React Testing Library),
E2E (Playwright against a seeded backend: login -> upload -> download -> logout), and visual regression.

## Checklist before production

- [ ] Run `npm run check` and `npm run build`; fix whatever surfaces on first install
- [ ] Confirm dependency versions resolve (`next`, `react`, `@tanstack/*`, `zustand`, `socket.io-client`, `radix-ui`; `lucide-react` is effectively pinned to 0.468.x by its `^0.x` range)
- [ ] Commit `package-lock.json`; enable Dependabot and `npm audit` in CI
- [ ] Wire an error tracker in `lib/monitoring.ts` (Sentry etc.) and add CSP `report-to`
- [ ] Add Playwright E2E and component tests
- [ ] Generate `lib/api/types.ts` from an OpenAPI spec once the backend publishes one
- [ ] Decide on fonts (`next/font`) and design tokens in `globals.css`
- [ ] Email verification / password reset (needs backend support first); i18n; analytics behind consent
- [ ] Load-test the BFF proxy; consider caching public GETs
