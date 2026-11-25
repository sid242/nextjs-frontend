import type { Metadata } from "next";

import { NotificationPreferencesCard, PushSettingsCard } from "@/features/notifications";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Notifications & Push Settings",
};

export default async function NotificationsSettingsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PushSettingsCard scope="tenant" />
      <NotificationPreferencesCard />
    </div>
  );
}
