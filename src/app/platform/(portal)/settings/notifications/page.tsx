import type { Metadata } from "next";

import { PageHeader } from "@/components/molecules/page-header";
import { PushSettingsCard } from "@/features/notifications";

export const metadata: Metadata = {
  title: "Push Notifications · Platform Console",
};

export default function PlatformNotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Push"
        description="Enable and test real-time Web Push alerts for your internal platform operator account."
      />
      <PushSettingsCard scope="platform" />
    </div>
  );
}
