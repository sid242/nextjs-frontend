---
name: verify-platform-and-tenant-flows
description: Review, change, or smoke-test the frontend and backend together when platform staff sign-in, customer workspace sign-in, session handoff, RBAC, or tenant API contracts are involved.
---

# Verify platform and tenant flows

This workspace pairs Next.js App Router on port 3001 with the Node.js Express API on port 3009. Read the applicable `AGENTS.md` in each checkout. Use the frontend's `design-system`, `scaffold-bff-route`, or `run-verification` skills and the backend's `testing-workflow`, `db-migration`, or `create-queue-worker` skill when their workflows apply.

## Trace the contract

- Start at the user-facing route. Follow the form, TanStack Query or server call, Next BFF route, Express mount, Zod DTO, then the service. Check that the final Express path includes both the mount and router path.
- Keep staff and customer session cookies distinct through the BFF. Platform 401s return to platform sign-in. Tenant session refresh and cross-host handoff belong to customer sessions. Preserve the source workspace and accepted return URL after either password sign-in or verification.
- React Hook Form and Zod own credential entry. Keep native fallback submissions out of query strings and prevent submissions while a client handler is loading. Keep field labels associated and use an inline alert for actionable failures.
- Confirm tenant permissions in Express, then verify page gates, navigation and actions in the UI. For workspace changes check the active tenant in the backend response as well as the URL. Use PostgreSQL/Drizzle for durable state and the existing Redis/BullMQ patterns for transient state and retryable work. Socket.IO, S3, and email have separate lifecycles. Verify the one that changed and make any live-provider prerequisites explicit.

## Verify locally

1. Use a seeded local account in a fresh browser context for each role. Use role and label locators in Playwright when available. Verify invalid input, success, direct protected URLs, one ordinary navigation or mutation, and logout for each affected session. Check desktop and narrow layouts when the UI changes.
2. Verify the frontend and API readiness endpoints. Watch browser console and failed API responses. A 200 HTML shell can still hide a failed data request. For uploads use local MinIO and for background work check the worker or queue result.
3. Use the repo's existing checks and relevant contract or regression tests. Test outbound email, external SSO, payments, or cloud infrastructure only with configured test providers and authorization. Reserve demo seeding for a fresh local database because it clears local data.
