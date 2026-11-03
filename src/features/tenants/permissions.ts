export { TENANT_PERMISSIONS, type TenantPermissionKey } from "@/config/permissions";

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
