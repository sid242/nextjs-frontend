import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminUsersCard } from "@/features/users";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "System Administration",
};

export default async function AdminSettingsPage() {
  const user = await requireUser();
  if (user?.role !== "ADMIN") {
    redirect("/settings/profile");
  }

  return (
    <div className="space-y-6">
      <AdminUsersCard />
    </div>
  );
}
