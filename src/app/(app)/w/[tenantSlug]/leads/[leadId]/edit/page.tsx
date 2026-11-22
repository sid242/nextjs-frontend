"use client";

import { useParams } from "next/navigation";

import { TENANT_PERMISSIONS } from "@/config/permissions";
import { LeadFormPage } from "@/features/leads";
import { TenantPermissionGate } from "@/features/tenants";

export default function EditLeadRoute() {
  const params = useParams<{ leadId: string }>();
  return (
    <TenantPermissionGate module="leads" permission={TENANT_PERMISSIONS.LEADS_READ}>
      <TenantPermissionGate permission={TENANT_PERMISSIONS.LEADS_UPDATE}>
        <LeadFormPage leadId={params?.leadId} />
      </TenantPermissionGate>
    </TenantPermissionGate>
  );
}
