"use client";

import { TENANT_PERMISSIONS } from "@/config/permissions";
import { LeadFormPage } from "@/features/leads";
import { TenantPermissionGate } from "@/features/tenants";

export default function NewLeadRoute() {
  return (
    <TenantPermissionGate module="leads" permission={TENANT_PERMISSIONS.LEADS_CREATE}>
      <LeadFormPage />
    </TenantPermissionGate>
  );
}
