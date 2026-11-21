import { PLATFORM_PERMISSION_KEYS } from "@/config/permissions";
import { PlatformPermissionGate, PlatformUsersTable } from "@/features/platform";

export const metadata = {
  title: "Customer User Accounts | Internal Console",
  description:
    "Inspect customer accounts, login telemetry, verification state, and suspend or reactivate access.",
};

export default function PlatformUsersPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.USERS_READ}>
      <PlatformUsersTable />
    </PlatformPermissionGate>
  );
}
