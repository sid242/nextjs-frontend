import type { StaffAuthProfile } from "./schemas";

export { PLATFORM_PERMISSION_KEYS, type PlatformPermissionKey } from "@/config/permissions";

export const PLATFORM_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SUPPORT_STAFF: "SUPPORT_STAFF",
  BILLING_STAFF: "BILLING_STAFF",
  TECHNICAL_SUPPORT: "TECHNICAL_SUPPORT",
  READ_ONLY_AUDITOR: "READ_ONLY_AUDITOR",
} as const;

export type PlatformRoleKey = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export function hasPlatformPermission(
  staff: StaffAuthProfile | null | undefined,
  required: string | string[],
): boolean {
  if (!staff) return false;
  if (staff.roleKey === PLATFORM_ROLES.SUPER_ADMIN) return true;
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
  if (staff.roleKey === PLATFORM_ROLES.SUPER_ADMIN) return true;
  const userPerms = staff.permissions ?? [];
  if (userPerms.includes("*")) return true;

  return required.every((perm) => userPerms.includes(perm));
}
