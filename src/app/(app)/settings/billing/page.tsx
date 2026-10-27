import type { Metadata } from "next";

import { InvoicesTable } from "@/features/billing";
import { TenantBillingCard } from "@/features/plans";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Subscription & Billing Plans | Workspace Settings",
  description: "Manage your organization tier, team seat allocation, and feature entitlements.",
};

export default function BillingSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_UPDATE}>
      <div className="space-y-6">
        <TenantBillingCard />
        <InvoicesTable />
      </div>
    </TenantPermissionGate>
  );
}
