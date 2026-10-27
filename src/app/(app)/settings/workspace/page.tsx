import type { Metadata } from "next";

import { TENANT_PERMISSIONS, TenantPermissionGate, TenantSettingsCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Workspace Settings",
};

export default function WorkspaceSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_READ}>
      <div className="space-y-6">
        <TenantSettingsCard />
      </div>
    </TenantPermissionGate>
  );
}
