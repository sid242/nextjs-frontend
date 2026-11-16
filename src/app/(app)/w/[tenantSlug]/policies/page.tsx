"use client";

import { PageHeader } from "@/components/molecules/page-header";
import { PoliciesTable } from "@/features/policies";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";

export default function PoliciesPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.POLICIES_READ}>
      <div className="space-y-6">
        <PageHeader
          title="Access Policies (PBAC)"
          description="Configure fine-grained attribute-based authorization rules, dynamic scoping, and attach them to workspace roles."
        />
        <PoliciesTable />
      </div>
    </TenantPermissionGate>
  );
}
