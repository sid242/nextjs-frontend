import type { Metadata } from "next";

import { PlanFormPage } from "@/features/plans";
import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";

export const metadata: Metadata = {
  title: "Provision Commercial Plan | SaaS Operator Portal",
  description:
    "Define a new monetization tier, seat quota, storage limits, and feature access flags.",
};

export default function NewPlatformPlanPage() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}>
      <PlanFormPage />
    </PlatformPermissionGate>
  );
}
