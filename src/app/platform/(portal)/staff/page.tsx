import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate, StaffTable } from "@/features/platform";

export const metadata = {
  title: "Platform Staff Directory | Internal Console",
  description: "Manage internal SaaS staff accounts, roles, and operational statuses.",
};

export default function PlatformStaffPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.STAFF_READ}>
      <StaffTable />
    </PlatformPermissionGate>
  );
}
