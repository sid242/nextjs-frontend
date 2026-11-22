import type { Metadata } from "next";

import { PageHeader } from "@/components/molecules/page-header";
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { FilesSummary, RecentFilesCard } from "@/features/files";
import { OnboardingChecklistCard } from "@/features/onboarding";
import { TenantPermissionGate } from "@/features/tenants";
import { requireUser } from "@/lib/auth/session";

import { DashboardQuickActions, DashboardWidgets } from "./dashboard-widgets";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-6">
      <PageHeader title={`Welcome back, ${user.firstName}`} />
      <DashboardQuickActions />
      <TenantPermissionGate permission={TENANT_PERMISSIONS.ONBOARDING_READ} hideInsteadOfBanner>
        <OnboardingChecklistCard />
      </TenantPermissionGate>
      <TenantPermissionGate permission={TENANT_PERMISSIONS.BILLING_READ} hideInsteadOfBanner>
        <DashboardWidgets />
      </TenantPermissionGate>
      <TenantPermissionGate permission={TENANT_PERMISSIONS.FILES_READ} hideInsteadOfBanner>
        <FilesSummary />
        <RecentFilesCard />
      </TenantPermissionGate>
    </div>
  );
}
