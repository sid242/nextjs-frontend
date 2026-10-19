import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/users";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Profile & Account Settings",
};

export default async function ProfileSettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">User Profile</CardTitle>
          <CardDescription className="text-xs">
            Manage your personal profile display name and credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
