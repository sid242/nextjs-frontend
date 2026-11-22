"use client";

import { PageHeader } from "@/components/molecules/page-header";
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { LeadsTable } from "@/features/leads";
import { TenantPermissionGate } from "@/features/tenants";

export default function LeadsPage() {
  return (
    <TenantPermissionGate module="leads" permission={TENANT_PERMISSIONS.LEADS_READ}>
      <div className="space-y-6">
        <PageHeader title="CRM Leads" description="View and manage prospective deals." />
        <LeadsTable />
      </div>
    </TenantPermissionGate>
  );
}
