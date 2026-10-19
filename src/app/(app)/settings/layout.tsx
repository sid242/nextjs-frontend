import type { ReactNode } from "react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/molecules/page-header";
import { requireUser } from "@/lib/auth/session";

import { SettingsNav } from "./settings-nav";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your profile credentials, workspace configuration, SMTP email server, and security sessions.",
};

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings & Administration"
        description="Manage your profile credentials, workspace configuration, SMTP email server, and security sessions."
      />

      <SettingsNav isAdmin={user?.role === "ADMIN"} />

      <div>{children}</div>
    </div>
  );
}
