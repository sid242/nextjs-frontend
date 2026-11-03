import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";
import { PlatformGroupsManager } from "@/features/user-groups";

export const metadata = {
  title: "Staff Groups | Internal Platform Console",
  description: "Manage internal operator groups, cohorts, and assignment rosters.",
};

export default function PlatformGroupsPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.GROUPS_READ}>
      <PlatformGroupsManager />
    </PlatformPermissionGate>
  );
}
