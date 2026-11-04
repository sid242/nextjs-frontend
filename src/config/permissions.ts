/**
 * Global Permission Constants
 *
 * This central configuration defines all permission keys used across the application.
 * Placing them in `@/config` ensures they are accessible by all architectural layers
 * (config, lib, components, features, and app routes) without violating ESLint boundary rules.
 */

export const TENANT_PERMISSIONS = {
  // Workspaces
  TENANTS_READ: "tenants:read",
  TENANTS_UPDATE: "tenants:update",
  TENANTS_DELETE: "tenants:delete",

  // Members & Teams
  MEMBERS_READ: "members:read",
  MEMBERS_INVITE: "members:invite",
  MEMBERS_UPDATE: "members:update",
  MEMBERS_DELETE: "members:delete",

  // User Groups
  GROUPS_READ: "groups:read",
  GROUPS_CREATE: "groups:create",
  GROUPS_UPDATE: "groups:update",
  GROUPS_DELETE: "groups:delete",
  GROUPS_MANAGE_MEMBERS: "groups:manage-members",
  GROUPS_ASSIGN_ROLES: "groups:assign-roles",

  // Dynamic RBAC Roles
  ROLES_READ: "roles:read",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_ASSIGN: "roles:assign",

  // Modules & Permissions
  MODULES_READ: "modules:read",
  MODULES_MANAGE: "modules:manage",
  PERMISSIONS_MANAGE: "permissions:manage",

  // File Storage (supports both files:write and files:upload)
  FILES_READ: "files:read",
  FILES_UPLOAD: "files:write",
  FILES_DELETE: "files:delete",

  // Audit Logs & Access Simulator
  AUDIT_READ: "audit:read",
  AUDIT_EXPORT: "audit:export",
  AUDIT_POLICY_MANAGE: "audit:retention:manage",
  ACCESS_READ: "access:read",
  ACCESS_SIMULATE: "access:simulate",

  // Addresses & Locations
  ADDRESSES_READ: "addresses:read",
  ADDRESSES_WRITE: "addresses:write",
  ADDRESSES_DELETE: "addresses:delete",
} as const;

export type TenantPermissionKey = (typeof TENANT_PERMISSIONS)[keyof typeof TENANT_PERMISSIONS];

export const PLATFORM_PERMISSION_KEYS = {
  STAFF_READ: "platform_staff::read",
  STAFF_CREATE: "platform_staff::create",
  STAFF_UPDATE: "platform_staff::update",
  STAFF_DISABLE: "platform_staff::disable",
  STAFF_SUSPEND: "platform_staff::disable",

  GROUPS_READ: "platform_groups::read",
  GROUPS_CREATE: "platform_groups::create",
  GROUPS_UPDATE: "platform_groups::update",
  GROUPS_DELETE: "platform_groups::delete",
  GROUPS_MANAGE_MEMBERS: "platform_groups::manage_members",

  USERS_READ: "platform_users::read",
  USERS_UPDATE: "platform_users::update",
  USERS_SUSPEND: "platform_users::suspend",

  ROLES_READ: "platform_roles::read",
  ROLES_MANAGE: "platform_roles::manage",
  PERMISSIONS_READ: "platform_permissions::read",

  TENANTS_READ: "tenants::read",
  TENANTS_MANAGE: "tenants::manage",
  TENANTS_SUSPEND: "tenants::suspend",

  SUPPORT_START: "tenant_support::start",
  SUPPORT_END: "tenant_support::end",

  BILLING_READ: "billing::read",
  BILLING_MANAGE: "billing::manage",

  AUDIT_READ: "platform_audit::read",
  HEALTH_READ: "system_health::read",
} as const;

export type PlatformPermissionKey =
  (typeof PLATFORM_PERMISSION_KEYS)[keyof typeof PLATFORM_PERMISSION_KEYS];
