import type { StaffAuthProfile } from "./schemas";

export const PLATFORM_PERMISSION_KEYS = {
  STAFF_READ: "platform_staff::read",
  STAFF_CREATE: "platform_staff::create",
  STAFF_UPDATE: "platform_staff::update",
  STAFF_DISABLE: "platform_staff::disable",
  STAFF_SUSPEND: "platform_staff::disable",

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

export function hasPlatformPermission(
  staff: StaffAuthProfile | null | undefined,
  required: string | string[],
): boolean {
  if (!staff) return false;
  if (staff.roleKey === "SUPER_ADMIN") return true;
  const userPerms = staff.permissions ?? [];
  if (userPerms.includes("*")) return true;

  if (Array.isArray(required)) {
    return required.some((perm) => userPerms.includes(perm));
  }
  return userPerms.includes(required);
}

export function hasAllPlatformPermissions(
  staff: StaffAuthProfile | null | undefined,
  required: string[],
): boolean {
  if (!staff) return false;
  if (staff.roleKey === "SUPER_ADMIN") return true;
  const userPerms = staff.permissions ?? [];
  if (userPerms.includes("*")) return true;

  return required.every((perm) => userPerms.includes(perm));
}
