import { PLATFORM_PERMISSION_KEYS } from "@/config/permissions";
import { PlatformPermissionGate, RolesMatrix } from "@/features/platform";

export const metadata = {
  title: "Platform Roles & Permissions | Internal Console",
  description:
    "Configure system & custom platform roles with canonical resource:action permissions.",
};

export default function PlatformRolesPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.ROLES_READ}>
      <RolesMatrix />
    </PlatformPermissionGate>
  );
}
