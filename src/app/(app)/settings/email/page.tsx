import type { Metadata } from "next";

import { TenantSmtpCard } from "@/features/tenants";

export const metadata: Metadata = {
  title: "Email (SMTP) Settings",
};

export default function EmailSettingsPage() {
  return (
    <div className="space-y-6">
      <TenantSmtpCard />
    </div>
  );
}
