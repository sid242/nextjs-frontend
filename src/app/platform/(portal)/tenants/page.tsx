import type { Metadata } from "next";

import { TenantsTable } from "@/features/platform";

export const metadata: Metadata = {
  title: "Customer Workspaces | Platform Operator Portal",
  description: "Monitor and administer tenant organizations, database routing, and subscriptions.",
};

export default function PlatformTenantsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Customer Workspaces</h1>
        <p className="text-muted-foreground text-xs">
          Multi-tenant organization lifecycle &bull; Database provisioning modes, subscription
          status, and audited troubleshooting
        </p>
      </div>

      <TenantsTable />
    </div>
  );
}
