import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AcceptInviteForm } from "@/features/auth";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

export const metadata: Metadata = { title: "Accept Invitation" };

export default async function TenantAcceptInvitePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const resolved = await resolveTenantBySlug(tenantSlug);
  if (!resolved || resolved.kind !== "tenant") {
    notFound();
  }

  if (resolved.status === "SUSPENDED" || resolved.status === "DEACTIVATED") {
    redirect("/tenant-suspended");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <AcceptInviteForm />
    </div>
  );
}
