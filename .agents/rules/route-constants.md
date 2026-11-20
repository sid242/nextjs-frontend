# Centralized Route Constants Invariant

Whenever creating, modifying, or referencing application routes, you **MUST** register and consume them via `src/config/routes.ts`.

---

## 1. Core Principles

1. **No Hardcoded Route Strings in UI / Feature Modules**:
   - Never write raw path strings like `href="/platform/tenants"`, `router.push("/platform/plans")`, or `redirect("/platform/login")` in components, hooks, or pages.
   - Always import and use the corresponding constant from `@/config/routes`.

2. **Mandatory Registration for New Routes**:
   - Whenever scaffolding a new page route under `src/app/`, immediately add the route constant to `src/config/routes.ts` before creating the page component or linking to it.

---

## 2. Route Categories & Usage

### 2.1 Platform Routes (`PLATFORM_ROUTES`)

Used for internal SaaS management portal routes:

```typescript
import { PLATFORM_ROUTES } from "@/config/routes";
import Link from "next/link";

// Static routes:
<Link href={PLATFORM_ROUTES.TENANTS}>Workspaces</Link>
<Link href={PLATFORM_ROUTES.PLANS}>Commercial Plans</Link>

// Dynamic parameter routes (builder functions):
<Link href={PLATFORM_ROUTES.TENANT_DETAIL(tenant.id)}>Inspect</Link>
<Link href={PLATFORM_ROUTES.PLAN_EDIT(plan.id)}>Edit Tier</Link>

// Programmatic navigation:
router.push(PLATFORM_ROUTES.STAFF);
redirect(PLATFORM_ROUTES.DASHBOARD);
```

### 2.2 Auth & Public Routes (`AUTH_ROUTES`)

Used for authentication and public landing routes:

```typescript
import { AUTH_ROUTES } from "@/config/routes";

<Link href={AUTH_ROUTES.LOGIN}>Sign In</Link>
<Link href={AUTH_ROUTES.REGISTER}>Create Account</Link>
<Link href={AUTH_ROUTES.FORGOT_PASSWORD}>Reset Password</Link>
```

### 2.3 Tenant Routes (`TENANT_PATHS` & `useTenantHref`)

Because tenant routes can operate in both **path mode** (`/w/:slug/...`) and **subdomain mode** (`/...`), tenant links must use `useTenantHref` (client) or `tenantHref(ctx)` (server) paired with `TENANT_PATHS`:

```typescript
import { TENANT_PATHS } from "@/config/routes";
import { useTenantHref } from "@/lib/tenancy";
import Link from "next/link";

function TenantNav() {
  const href = useTenantHref();

  return (
    <nav>
      <Link href={href(TENANT_PATHS.DASHBOARD)}>Dashboard</Link>
      <Link href={href(TENANT_PATHS.LEADS)}>Leads</Link>
      <Link href={href(TENANT_PATHS.FILES)}>Files</Link>
      <Link href={href(TENANT_PATHS.SETTINGS_BILLING)}>Billing Settings</Link>
    </nav>
  );
}
```

---

## 3. Checklist for New Page Routes

When adding a new route:

- [ ] Add the route key/constant (or builder function for dynamic params) to `src/config/routes.ts`.
- [ ] If tenant-scoped, verify `npm run lint:hrefs` passes with 0 unscoped link errors.
- [ ] Verify TypeScript compiles with `npm run typecheck` (`tsc --noEmit`).
