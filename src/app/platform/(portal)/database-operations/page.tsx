import {
  DatabaseOperationsTable,
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
} from "@/features/platform";

export const metadata = {
  title: "Tenant Database Operations | Internal Console",
  description:
    "Monitor schema versions, hybrid placement strategies, health latency & migration concurrency.",
};

export default function PlatformDatabaseOperationsPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.HEALTH_READ}>
      <DatabaseOperationsTable />
    </PlatformPermissionGate>
  );
}
