import type { Metadata } from "next";

import { TenantBillingCard } from "@/features/plans";

export const metadata: Metadata = {
  title: "Subscription & Billing Plans | Workspace Settings",
  description: "Manage your organization tier, team seat allocation, and feature entitlements.",
};

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <TenantBillingCard />
    </div>
  );
}
