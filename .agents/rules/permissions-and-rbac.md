# Permission-Driven UI Rendering & RBAC Gating

This rule establishes strict zero-standing exposure standards across both Platform (Admin) and Customer Tenant applications.

---

## 1. Zero-Exposure Policy

If an internal operator or tenant user lacks a permission, the interface must **never** render or expose:

1. **Navigation Links**: Sidebar items, section headings, and breadcrumb options.
2. **Action Buttons**: Buttons or controls that initiate mutating actions (e.g., `+ Create Custom Role`, `+ Provision Staff Member`, `+ Invite Member`, `Upload Files`, `Delete File`, `Suspend Tenant`).
3. **Dropdown Menu Items & Select Options**: Context menu actions (e.g. `Change Role`, `Remove Member`, `Transfer Ownership`).
4. **Settings Tabs**: Navigation tabs that configure sensitive subdomains (e.g. Workspace Settings, Branding, Billing & Subscriptions, SMTP Email).

---

## 2. Dynamic Navigation Filtering

- **Platform Surface**: Filter `NAV_ITEMS` in `PlatformShell` using `hasPlatformPermission(staff, item.permission)`.
- **Tenant Surface**: Filter sections and items in `SidebarNav` / `TenantSidebarNav` using `hasTenantPermission(context?.permissions, item.permission)`.

```typescript
// Platform example:
const visibleNavItems = NAV_ITEMS.filter((item) => hasPlatformPermission(staff, item.permission));

// Tenant example:
const isVisible = hasTenantPermission(userPermissions, item.permission);
```

---

## 3. Direct Route Gating

Direct URL entry (e.g. typing `/platform/roles` or `/roles` into the browser) must not fail with background 403 API errors or render empty interactive states:

- Wrap pages with `<PlatformPermissionGate permission={...}>` or `<TenantPermissionGate permission={...}>`.
- When access is denied, render an accessible "Access Restricted" alert card specifying the active role and required capability with a clean fallback navigation button.

---

## 4. Action Gating Patterns

For action buttons within tables, headers, and toolbars:

- Use the gate's `hideInsteadOfBanner` prop:
  ```tsx
  <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE} hideInsteadOfBanner>
    <Button onClick={() => setCreateDialogOpen(true)}>+ Create Custom Role</Button>
  </PlatformPermissionGate>
  ```
- Or compute inline flags:
  ```tsx
  const canDelete = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.FILES_DELETE);
  {
    canDelete ? <Button onClick={() => deleteFile(id)}>Delete</Button> : null;
  }
  ```

---

## 5. BFF Proxy Route Classification & Platform 401 Interception

- In `src/app/api/proxy/[...path]/route.ts`:
  - Classify all platform routes (`/platform/*`, `/plans/platform*`) as `isPlatformRoute`.
  - For `isPlatformRoute === true`, forward `PLATFORM_STAFF_COOKIE` (`platform_staff_token`).
  - For `isPlatformRoute === false`, forward `ACCESS_COOKIE` (`access_token`).
- In `src/lib/api/http.ts`:
  - Intercepting 401 on `/platform/*` routes must redirect directly to `/platform/login`.
  - Never trigger the tenant `/api/auth/refresh` cycle for platform staff sessions.
