import type { Metadata } from "next";

import { TENANT_PERMISSIONS, TenantBrandingCard, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Branding & Theme Settings",
};

export default function BrandingSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_UPDATE}>
      <div className="space-y-6">
        <TenantBrandingCard />
      </div>
    </TenantPermissionGate>
  );
}
