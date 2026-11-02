import type { Metadata } from "next";

import { TENANT_PERMISSIONS, TenantPermissionGate, TenantSmtpCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Email (SMTP) Settings",
};

export default function EmailSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_UPDATE}>
      <div className="space-y-6">
        <TenantSmtpCard />
      </div>
    </TenantPermissionGate>
  );
}
