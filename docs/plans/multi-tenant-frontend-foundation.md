# Multi-Tenant Frontend Foundation Plan

This repository provides a reusable Next.js application shell for multi-tenant SaaS products. The foundation owns identity, workspace context, navigation, and shared UI. Each business module owns its routes, records, terminology, and workflows.

The companion backend plan is `docs/plans/multi-tenant-backend-foundation.md` in `nodejs-backend`.

## Phase status

| Phase                | Status                    | Remaining work                                                                                                                                                |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 · Baseline         | Complete locally          | Run the paired GitHub Actions workflow on the published changes.                                                                                              |
| 1 · Shared flows     | Complete locally          | Verify custom-domain sign-in, handoff, and logout with staging DNS and TLS.                                                                                   |
| 2 · Optional modules | Complete for Leads        | Repeat the module acceptance checks when a second business module is added.                                                                                   |
| 3 · Release          | Staging verification open | Verify provider-backed SSO, SCIM directory sync, email, and checkout. Extend import mapping and operational-unit UI once a second module defines their rules. |

### Completed by phase

- **Phase 0.** Isolated bootstrap, readiness checks, browser fixtures, and a paired CI workflow for two configurations.
- **Phase 1.** Workspace-scoped queries and realtime, permission-aware navigation and actions, file scan states, signed storage access, workspace switching, and the delegated support lifecycle.
- **Phase 2.** Leads uses the optional module registry and effective permissions. Local browser checks cover deployments with Leads enabled and omitted.
- **Phase 3.** Member import preview, progress, and duplicate submission handling, plus the enterprise setup checklist.

### Local verification

| Check               | Result                                                       |
| ------------------- | ------------------------------------------------------------ |
| Frontend test suite | 276 passed                                                   |
| Production build    | Passed                                                       |
| Playwright          | 10 flows passed with Leads enabled and 10 with Leads omitted |

The browser suite covers staff and workspace authentication, permissions, member import, file stream revocation, same-host switching, localhost subdomain handoff, keyboard menu focus, and switching users in the same tab. The support-expiry case uses the Playwright clock to verify the automatic return to the platform with the staff session intact.

## Architecture and shared contracts

- **Application structure.** Keep dependencies flowing from `src/app` through `src/features` and `src/components` to `src/lib` and `src/config`. Routes consume public feature exports. Shared components take typed props and slots. Centralize paths and URL builders in `src/config/routes.ts`.
- **Sessions and routing.** Keep platform staff and tenant cookies separate. Select credentials at the backend-for-frontend (BFF) boundary and apply customer refresh only to tenant sessions. Resolve workspace routing through `src/proxy.ts` and the server tenant resolver. The backend verifies membership for the chosen workspace.
- **Permissions and availability.** Use backend permissions and effective module capabilities for navigation, pages, search, and actions. Keep deployment configuration, plan entitlements, rollout flags, and member permissions as separate inputs.
- **API and state.** Use versioned API contracts through the BFF. Coordinate schemas, pagination, request IDs, and `401`, `403`, and `404` responses with the backend. Use TanStack Query for server state and Zustand for client UI state. Scope data and invalidation keys by tenant and by any additional resource boundary that affects the result. Keep server credentials under `src/lib/server`.
- **Shared UI.** Reuse responsive shells, controlled forms, accessible dialogs, tables, breadcrumbs, theme tokens, loading states, and error feedback. Keep feature workflows in their owning modules.

## Module acceptance criteria

1. **Platform staff and tenant operations.** Staff use a separate session and return to a validated platform route. Show provisioning progress, failure and retry, owner invitation status, plan, and workspace status where supported. Restricted staff cannot see or invoke prohibited actions. The support banner shows tenant, scope, and expiry. Exit and expiry clear the delegated workspace view and preserve the staff session.
2. **Customer identity and workspace switching.** Preserve workspace context and a validated return path through sign-in, MFA, recovery, invitations, and supported handoffs. Cover invite acceptance, resend, and expired or revoked links. Switching cancels old reads, resets workspace UI and reconnects realtime for the destination. Browser back and same-tab account changes preserve the correct data and permissions. A failed switch leaves the current workspace usable.
3. **Authorization and navigation.** Apply effective permissions to navigation, direct routes, search, and actions. Keep record-level denial distinguishable from loading and request failure. Verify the owner, viewer, and restricted-member cases on desktop and narrow layouts, including keyboard focus.
4. **Files and realtime.** Distinguish upload, scan, availability, quarantine, and failure. Gate preview, download, and sharing on approved availability. Scope transfers, unread counts, and subscriptions by workspace. Refetch after reconnect so the UI can recover missed events.
5. **Enterprise setup and lifecycle.** Use server-confirmed plan, billing, and seat state. Cover checkout, plan effective dates, exhausted seats, exports, and closure. Keep progress visible after reload and expose actionable errors, request IDs, and safe retry options. The setup checklist covers SSO, directory sync, domain status, and scoped audit export.
6. **Optional feature composition.** Register navigation and capabilities at the application boundary. Keep search and direct routes consistent with access decisions. A disabled module loses its entry points. Re-enabling restores the existing routes and records.
7. **Reusable workflow extensions.** Apply the shared UI to a second module once it defines fields, import rules, and any operational units. Keep preview read-only, show row errors and job progress, and verify that choosing a unit grants no access on its own.
8. **Paired release verification.** Start both apps with isolated tenants, staff, and members with different roles. Assert the backend tenant identity, browser URL, and visible data. Capture request IDs and browser traces on failures.

## Release checklist

1. Run the checks below and the paired browser suite with Leads enabled and omitted.
2. Publish the paired changes and record the first hosted CI result.
3. Exercise custom-domain handoff and the provider-backed enterprise flows in staging.
4. Release compatible backend contracts before enabling dependent frontend routes.

```sh
npm run check
npm run lint:hrefs
npm run build
npm run test:e2e
```
