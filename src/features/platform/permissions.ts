import type { StaffAuthProfile } from "./schemas";

export { PLATFORM_PERMISSION_KEYS, type PlatformPermissionKey } from "@/config/permissions";

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
