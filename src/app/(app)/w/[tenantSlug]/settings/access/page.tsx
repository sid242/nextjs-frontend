import type { Metadata } from "next";

import { AccessSimulatorContainer } from "@/features/access-simulator";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Effective Access & Permissions Simulator",
};

export default function TenantAccessSimulatorSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.ROLES_READ}>
      <AccessSimulatorContainer />
    </TenantPermissionGate>
  );
}
