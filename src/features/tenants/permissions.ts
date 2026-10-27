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

  // Audit Logs
  AUDIT_READ: "audit:read",
} as const;

export type TenantPermissionKey = (typeof TENANT_PERMISSIONS)[keyof typeof TENANT_PERMISSIONS];

export function hasTenantPermission(
  userPermissions: string[] | undefined | null,
  required: string | string[] | undefined | null,
): boolean {
  if (!required) return true;
  if (!userPermissions) return false;
  if (userPermissions.includes("*")) return true;

  const checkSingle = (perm: string): boolean => {
    if (userPermissions.includes(perm)) return true;
    if (perm === "files:write" && userPermissions.includes("files:upload")) return true;
    if (perm === "files:upload" && userPermissions.includes("files:write")) return true;
    return false;
  };

  if (Array.isArray(required)) {
    return required.some(checkSingle);
  }
  return checkSingle(required);
}
