"use client";

import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";
import { TenantGroupsManager } from "@/features/user-groups";

export default function TenantGroupsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.GROUPS_READ}>
      <TenantGroupsManager />
    </TenantPermissionGate>
  );
}
