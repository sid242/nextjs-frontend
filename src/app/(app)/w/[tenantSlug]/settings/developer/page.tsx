import type { Metadata } from "next";

import { ApiKeysCard, WebhooksCard } from "@/features/developers";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Developers, API Keys & Webhooks",
};

export default function TenantDeveloperSettingsPage() {
  return (
    <TenantPermissionGate
      permission={[
        TENANT_PERMISSIONS.TENANTS_UPDATE,
        TENANT_PERMISSIONS.API_KEYS_READ,
        TENANT_PERMISSIONS.WEBHOOKS_READ,
      ]}
    >
      <div className="space-y-6">
        <ApiKeysCard />
        <WebhooksCard />
      </div>
    </TenantPermissionGate>
  );
}
