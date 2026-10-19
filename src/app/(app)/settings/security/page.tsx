import type { Metadata } from "next";

import { ActiveSessionsCard, ChangePasswordCard } from "@/features/auth";

export const metadata: Metadata = {
  title: "Security & Sessions Settings",
};

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <ActiveSessionsCard />
    </div>
  );
}
