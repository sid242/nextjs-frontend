import type { Metadata } from "next";

import { TENANT_PERMISSIONS, TenantPermissionGate, TenantUrlCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Domains & URL Settings",
  description: "Configure workspace canonical URL and custom white-label domain.",
};

export default function UrlSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_UPDATE}>
      <div className="space-y-6">
        <TenantUrlCard />
      </div>
    </TenantPermissionGate>
  );
}
