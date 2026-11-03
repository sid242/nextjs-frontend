import type { Metadata } from "next";

import { AddressBook } from "@/features/addresses";
import { TENANT_PERMISSIONS, TenantPermissionGate, TenantSettingsCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Workspace Settings",
};

export default function WorkspaceSettingsPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_READ}>
      <div className="space-y-6">
        <TenantSettingsCard />
        <TenantPermissionGate permission={TENANT_PERMISSIONS.ADDRESSES_READ} hideInsteadOfBanner>
          <AddressBook
            scope={{ kind: "workspace" }}
            title="Workspace Addresses"
            description="Physical office locations, branches, and registered business addresses."
          />
        </TenantPermissionGate>
      </div>
    </TenantPermissionGate>
  );
}
