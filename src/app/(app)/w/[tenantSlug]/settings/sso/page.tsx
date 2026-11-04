import type { Metadata } from "next";

import { TenantSsoCard } from "@/features/sso";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "SSO & SCIM Directory Sync",
};

export default function TenantSlugSsoSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_UPDATE}>
      <div className="space-y-6">
        <TenantSsoCard />
      </div>
    </TenantPermissionGate>
  );
}
