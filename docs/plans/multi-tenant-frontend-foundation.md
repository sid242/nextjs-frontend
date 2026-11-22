# Multi-Tenant Frontend Foundation Plan

**Goal** · Provide a reusable web application shell that hosts independently owned business features across multiple tenant deployments. The foundation owns identity, tenant context, shared UI, and feature composition. Applications own their entities, workflows, terminology, and product policies.

**Baseline** · Next.js App Router, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Axios, React Hook Form, Zod, and Zustand. This PR hardens sign-in and recovery, improves permission-aware workspace screens, and fixes shared plan and seat displays. The companion backend plan is `nodejs-backend/docs/plans/multi-tenant-backend-foundation.md`. [Frontend PR #1](https://github.com/sid242/nextjs-frontend/pull/1) · [Backend PR #1](https://github.com/sid242/nodejs-backend/pull/1)

## Architecture and ownership

| Surface                   | Foundation responsibility                                                                                                                | Extension boundary                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication            | Separate platform staff and tenant user sessions, HttpOnly cookies, sign-in, MFA, recovery, sign-out, and tenant handoff through the BFF | Reuse the session lifecycle and route guards. Product-specific identity providers integrate through the established authentication layer         |
| Tenancy and authorization | Workspace resolution, switching, branding, invitations, membership, permission-aware navigation, page gates and action visibility        | Features register permission keys and make UI decisions from effective backend permissions. The API enforces the same access for direct requests |
| Layout and navigation     | Platform and tenant shells, responsive navigation, breadcrumbs, theme tokens, accessibility and shared loading/error states              | The application composition layer supplies route entries, labels, and optional slots. Shells render descriptors supplied by the caller           |
| API and state             | Request tracing, validated data, normalized errors, tenant-aware query keys and SSR hydration                                            | Each feature owns its API client, schemas, query keys and query hooks. Use Zustand for client-owned UI state                                     |
| Shared components         | Accessible inputs, forms, dialogs, tables, pagination, menus and reusable page structures                                                | Compose shared primitives from feature screens. Keep feature workflows out of lower-level components                                             |

Preserve the dependency direction `src/app → src/features → src/components → src/lib and src/config`. Routes consume public feature barrels. Shared UI accepts typed props and slots. Keep server credentials and native server fetch in `src/lib/server`. Use the BFF for browser requests and React Server Components for server rendering where useful. Keep page, auth, and tenant URL builders centralized in `src/config/routes.ts`.

## Shared contract with the backend

- Resolve workspace context through `src/proxy.ts` and the server tenant resolver. Derive trusted upstream context from the request and reject tenant mismatches. Treat client-selected workspace identifiers as routing input that the backend verifies against membership.
- Keep platform and tenant cookies distinct. Resolve the credential by API route scope, and run customer refresh only for tenant sessions. Clear or partition tenant-scoped query data and reset workspace UI state when the active session or tenant changes.
- Use the backend's effective permissions for route, navigation, and action visibility. Require an enabled capability and the necessary permission before rendering a module entry. Keep entitlement, rollout flag, and authorization as separate decisions.
- Consume versioned REST contracts through the BFF. Agree on request and response schemas, pagination, `401`, `403` and `404` behavior, correlation IDs, and optional response fields before changing consumers. Scope query keys by tenant and by any resource boundary that affects the response.
- Keep business-specific routes, labels, rules, forms, and events in the owning feature. The existing Leads slice is a candidate for optional composition. Retain its route and behavior for current users while introducing a way for a new deployment to omit it.

## Phased implementation

| Phase                          | Work                                                                                                                                                                                                                                                                                             | Acceptance gate                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 · Establish the baseline     | Inventory shared shells, auth/BFF boundaries, direct feature dependencies, route builders, session transitions, and existing flags. Document what is reusable today and what requires extraction.                                                                                                | Maintain a verified baseline for platform sign-in, workspace sign-in, tenant switching, and permission gates using synthetic accounts.                                                                             |
| 1 · Harden common journeys     | Standardize tenant-scoped query keys, sidebar and server page gates, role-driven actions, error feedback, and membership settings. Reuse accessible controlled forms and responsive shells across views.                                                                                         | A user switching between two workspaces never sees data from the former workspace. A restricted role sees neither hidden actions nor protected navigation. Direct URLs show an accessible denial.                  |
| 2 · Compose optional modules   | Define a typed, build-time module descriptor for stable module keys, routes, navigation, permission prerequisites, enablement, and feature-owned search contributions where needed. Assemble descriptors at the application boundary from deployment configuration and backend capability state. | The same frontend builds and runs with a sample module enabled and omitted. Disabled modules are absent from navigation and search and reject direct routes consistently. Existing enabled routes stay compatible. |
| 3 · Validate reuse and release | Document configuration, local setup, extension steps, migration order, and CI requirements. Prove reuse with two synthetic configurations and lightweight browser flows for shared login, workspace admin and an optional feature.                                                               | Both configurations run without edits to shared components or auth. Mobile and keyboard navigation, tenant isolation, and backend contract checks pass before publishing a foundation version.                     |

## Remaining implementation by module

The items below are implementation work. The current PR establishes the baseline and does not mark these items complete. Findings marked **Code finding** were observed in source. Items marked **Flow verification** need a paired runtime test. The numbered modules correspond to the companion backend plan.

### 1. Platform staff identity and tenant operations

**Phase 1 · Flow verification.** Verify staff sign-in, MFA or recovery where enabled, session expiry, and logout. Trace the platform login form through the BFF to the staff API. Preserve a validated same-surface return path. Route staff 401 responses to platform sign-in and keep customer refresh out of that path.

- Use the existing platform shell and permissions to expose the tenant lifecycle. Show provisioning progress, failure reason and retry where supported, owner invitation status, assigned plan, and suspension or reactivation state. Render mutations only for permitted staff.
- Show an active support-session banner with tenant, access scope, expiry, and an exit action. Clear tenant state and close the realtime connection when support ends or expires. Preserve the independent staff session.
- **Accept when** a restricted operator cannot see or invoke restricted actions, a provisioning retry does not duplicate a workspace, and an expired support session returns the operator to a usable platform screen.

### 2. Customer identity, invitations and workspace switching

**Phase 1 · Code finding and flow verification.** The current switcher removes most cached queries, while Files and Leads query keys omit tenant identity. Separate cache entries by workspace and validate the transition end to end.

- Cover invitation acceptance and resend, expired or revoked links, password sign-in and recovery, MFA, workspace selection, and logout. Keep the selected tenant and a validated return path through authentication and supported cross-host handoffs.
- Use tenant ID in tenant-owned list, detail, and mutation invalidation keys. Include child resource scope when it changes the result. Pass AbortSignal to reads and cancel outgoing tenant work. Reset tenant-owned UI state and reconnect to tenant-scoped realtime after the destination is confirmed. Reuse the same transition for sidebar and direct-route entry.
- Derive workspace display and permissions from the resolved server context. Render loading, access denied, suspended, and unavailable states explicitly. Keep the current workspace usable on a failed switch.
- **Accept when** a multi-workspace member can switch rapidly and use browser back without seeing the previous workspace's records, permissions, progress, or notifications. Add cases for sign-out/sign-in in the same browser and lost membership between requests.

### 3. Authorization, navigation and shared UI

**Phase 1 · Code finding.** The CRM Leads entry and page lack a permission gate and Create appears unconditionally. Use this module to establish the pattern for the rest of the workspace.

- Use platform and tenant permission gates with effective backend access. Filter sidebar, quick actions, and search links. Gate direct routes and individual controls. Apply page and action checks at the appropriate boundary, including edit and delete where permissions differ.
- Reuse route builders, page headers, controlled forms, accessible errors, empty states, and mutation feedback. Preserve keyboard focus on failed submissions and route transitions. Use API error codes and request IDs for recovery and support.
- When access changes, refresh the effective context and invalidate relevant cached data. Handle record-level denial as a normal API outcome even when a user can enter the module.
- **Accept when** a role matrix covering owner, read-only member, and restricted member produces matching navigation, actions, page outcomes and API decisions. Check direct links, desktop and narrow layouts, and keyboard navigation.

### 4. Files, notifications and realtime

**Phase 1 · Code finding and flow verification.** Treat upload confirmation, processing, and file availability as distinct states.

- Map backend upload and scan statuses to accessible UI: uploading, processing, available, quarantined, failed. Disable preview, download and sharing while unavailable. Reconcile state on reconnect or reload rather than relying on a single socket event. Keep retry actions aligned with the backend policy.
- Scope event subscriptions, pending uploads, notification lists and unread counts to the active workspace. Refresh from the API after reconnect or membership changes. Render delivery states only for configured channels.
- **Accept when** files stay unavailable during processing and on scanner failure, the UI updates after successful verification, and switching workspaces never surfaces the old workspace's transfer or notification events.

### 5. Commercial, workspace lifecycle and enterprise setup

**Phase 1 verification, Phase 3 admin experience.** The repositories already have subscription, SSO, SCIM, audit and privacy surfaces.

- Show purchased capabilities and seat usage from server state. Verify checkout pending, outcome and reconciliation, upgrade and downgrade effective dates, and exhausted seats. Keep redirects deterministic and wait for authoritative billing state.
- Exercise member role changes and revocation, tenant export and closure progress, failed jobs, and recovery states. Present operation status and safe retry actions for existing requests.
- Add a tenant admin checklist around existing SSO and directory setup: connection status and testing, domain verification where supported, directory sync health, and audit export. Display scope, permission requirements, and request IDs when setup fails.
- **Accept when** a tenant admin can complete supported setup using test provider credentials, track pending operations after reload, and see plan capabilities update only when confirmed by the API.

### 6. Optional feature composition

**Phase 2 · Implementation gap.** Use Leads as the first optional feature and preserve its existing route and data for current deployments.

- Define typed descriptors at the application composition boundary for module key, routes, navigation, searchable entries, and required permissions. Use the backend's effective tenant capability response for runtime availability. Keep deployment configuration, commercial entitlement, rollout, and user permission distinct.
- Apply the same decision to server route entry, navigation, quick actions, and search results. Keep shared shells independent of feature imports. Expose feature-owned functionality through public barrels and centralize paths in the route config.
- **Accept when** a deployment can omit Leads and an installed deployment can disable it for one tenant. Both states remove entry points and return a consistent direct-route outcome. Re-enabling restores existing enabled routes and records without changes to shared shells.

### 7. Reusable workflow extensions

**Phase 3 · Add when a second application validates the contract.** Provide import preview and field mapping, server-validated row errors, asynchronous progress, and a result summary. Expose an optional operational-unit selector when a module supplies labels and authorized choices. Reuse the same layout and form infrastructure for separate applications. Module owners define their records, imports, unit hierarchy and workflow rules.

- **Accept when** two synthetic configurations can reuse the shell, navigation, form and status components without editing shared code. Preview makes no writes, retry respects idempotency, and a selected unit alone grants no access.

### 8. Paired browser and release verification

**Phase 0 baseline, Phase 3 release gate.** Add a browser job that starts both applications with isolated fixtures for two tenants, a multi-tenant member, a restricted member and platform staff. Check readiness before tests. Exercise modules 1–6, capture failed API responses and traces, and confirm enabled and disabled deployments. Keep external SSO, email and payments in separate sandbox-backed checks. The CI suite should verify the actual tenant returned by the backend as well as the URL and visible data.

**Delivery order.** Establish fixtures and reproduce the findings. Land tenant context, authorization and file-status contracts, then ship corresponding UI handling and regressions. Add optional composition after the access contract stabilizes. Release admin and workflow extensions after reuse is proven.

## Verification and release order

1. Align module keys, permissions, API schemas and denied responses with the backend. Add the backend contracts before exposing dependent UI. Roll out additive API changes first, then enable navigation and routes behind configuration.
2. Run `npm run check`, `npm run lint:hrefs` and `npm run build`. Exercise platform and tenant sign-in/sign-out, wrong-tenant deep links, tenant switching, role changes and an enabled/disabled module using two tenants and several roles.
3. Document feature ownership and assumptions in each paired PR. Treat future product workflows as feature extensions. This roadmap describes compatibility and acceptance criteria for future implementation.
