"use client";

import { TenantPermissionGate } from "@/features/tenants";
import { TenantGroupsManager } from "@/features/user-groups";

export default function TenantGroupsPage() {
  return (
    <TenantPermissionGate permission="groups:read">
      <TenantGroupsManager />
    </TenantPermissionGate>
  );
}
