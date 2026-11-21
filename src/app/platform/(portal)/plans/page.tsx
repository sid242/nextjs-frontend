import { PLATFORM_PERMISSION_KEYS } from "@/config/permissions";
import { PlatformPlansTable } from "@/features/plans";
import { PlatformPermissionGate } from "@/features/platform";

export const metadata = {
  title: "Commercial Plans & Entitlements | SaaS Operator Portal",
  description: "Configure multi-tenant subscription tiers, seat limits, and storage quotas.",
};

export default function PlatformPlansPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.BILLING_READ}>
      <PlatformPlansTable />
    </PlatformPermissionGate>
  );
}
