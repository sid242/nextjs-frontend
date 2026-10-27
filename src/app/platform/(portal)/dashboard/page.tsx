import type { Metadata } from "next";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformDashboard,
  PlatformPermissionGate,
} from "@/features/platform";

export const metadata: Metadata = {
  title: "Operations Dashboard | Platform Control Plane",
  description:
    "Real-time telemetry, multi-tenant workspace provisioning, and security compliance overview.",
};

export default function PlatformDashboardPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.TENANTS_READ}>
      <PlatformDashboard />
    </PlatformPermissionGate>
  );
}
