import type { Metadata } from "next";

import { PlanFormPage } from "@/features/plans";
import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";

export const metadata: Metadata = {
  title: "Edit Commercial Plan | SaaS Operator Portal",
  description:
    "Update pricing, seat capacity, cloud quotas, and feature entitlements for this plan.",
};

export default function EditPlatformPlanPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}>
      <PlanFormPage />
    </PlatformPermissionGate>
  );
}
