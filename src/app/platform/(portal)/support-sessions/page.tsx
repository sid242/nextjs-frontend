import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  SupportSessionsTable,
} from "@/features/platform";

export const metadata = {
  title: "Audited Customer Support Delegation | Internal Console",
  description:
    "Time-bound, purpose-limited cross-tenant delegation with zero standing customer privileges.",
};

export default function PlatformSupportSessionsPage() {
  return (
    <PlatformPermissionGate
      permission={[PLATFORM_PERMISSION_KEYS.SUPPORT_START, PLATFORM_PERMISSION_KEYS.SUPPORT_END]}
    >
      <SupportSessionsTable />
    </PlatformPermissionGate>
  );
}
