import type { Metadata } from "next";

import { ActiveSessionsCard, ChangePasswordCard, TwoFactorSettingsCard } from "@/features/auth";

export const metadata: Metadata = {
  title: "Security & Sessions Settings",
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <TwoFactorSettingsCard />
      <ChangePasswordCard />
      <ActiveSessionsCard />
    </div>
  );
}
