import type { Metadata } from "next";

import { TenantBrandingCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Branding & Theme Settings",
};

export default function BrandingSettingsPage() {
  return (
    <div className="space-y-6">
      <TenantBrandingCard />
    </div>
  );
}
