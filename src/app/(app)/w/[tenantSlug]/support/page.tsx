"use client";

import { PageHeader } from "@/components/molecules/page-header";
import { FeedbackWidget, SupportTicketsCard } from "@/features/support";
import { TENANT_PERMISSIONS, TenantPermissionGate, useActiveTenant } from "@/features/tenants";

export default function SupportPage() {
  const { activeTenant } = useActiveTenant();

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.SUPPORT_READ}>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Help & Support Desk"
            description={`Technical assistance, incident ticketing, and customer operations for ${activeTenant?.name ?? "your organization"}.`}
          />
          <FeedbackWidget />
        </div>

        <SupportTicketsCard />
      </div>
    </TenantPermissionGate>
  );
}
