import type { Metadata } from "next";

import {
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  ProvisionTenantPage,
} from "@/features/platform";

export const metadata: Metadata = {
  title: "Provision Organization | Platform Operator Portal",
  description:
    "Deploy a new customer tenant organization, configure database isolation, and generate initial owner credentials.",
};

export default function NewTenantRoute() {
  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.TENANTS_MANAGE}>
      <ProvisionTenantPage />
    </PlatformPermissionGate>
  );
}
