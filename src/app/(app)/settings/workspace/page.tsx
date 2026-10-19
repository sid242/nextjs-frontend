import type { Metadata } from "next";

import { TenantSettingsCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Workspace Settings",
};

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <TenantSettingsCard />
    </div>
  );
}
