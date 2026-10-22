import { PlatformPlansTable } from "@/features/plans";

export const metadata = {
  title: "Commercial Plans & Entitlements | SaaS Operator Portal",
  description: "Configure multi-tenant subscription tiers, seat limits, and storage quotas.",
};

export default function PlatformPlansPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Plans & Entitlements</h1>
        <p className="text-muted-foreground text-xs">
          Global SaaS monetization catalogue &bull; Tiered seat capacity, custom RBAC toggles, and
          cloud storage limits
        </p>
      </div>

      <PlatformPlansTable />
    </div>
  );
}
