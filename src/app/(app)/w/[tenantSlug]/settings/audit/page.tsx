import type { Metadata } from "next";

import { AuditSettingsContainer } from "@/features/audit";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Audit Logs & Compliance Retention",
};

export default function TenantAuditSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.AUDIT_READ}>
      <AuditSettingsContainer />
    </TenantPermissionGate>
  );
}
