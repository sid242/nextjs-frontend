"use client";

import Link from "next/link";
import { HistoryIcon, MailIcon, PlusIcon, ShieldAlertIcon } from "lucide-react";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryLogsTable, SuppressionsTable, TemplatesTable } from "@/features/email-templates";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy";

export default function EmailTemplatesPage() {
  const tenantHref = useTenantHref();

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_READ}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeader
            title="Email Templates & Delivery"
            description="Create, customize, and manage responsive email templates, monitor delivery logs, and manage recipient suppressions."
          />
          <TenantPermissionGate
            permission={TENANT_PERMISSIONS.EMAIL_TEMPLATES_WRITE}
            hideInsteadOfBanner
          >
            <Button asChild className="h-10 shrink-0 gap-2 rounded-xl px-4 font-semibold shadow-xs">
              <Link href={tenantHref("/email-templates/new")}>
                <PlusIcon className="size-4" />
                <span>New Email Template</span>
              </Link>
            </Button>
          </TenantPermissionGate>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <MailIcon className="size-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="delivery-logs" className="gap-2">
              <HistoryIcon className="size-4" />
              <span>Delivery Logs</span>
            </TabsTrigger>
            <TabsTrigger value="suppressions" className="gap-2">
              <ShieldAlertIcon className="size-4" />
              <span>Suppressions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <TemplatesTable />
          </TabsContent>

          <TabsContent value="delivery-logs" className="mt-4">
            <DeliveryLogsTable />
          </TabsContent>

          <TabsContent value="suppressions" className="mt-4">
            <SuppressionsTable />
          </TabsContent>
        </Tabs>
      </div>
    </TenantPermissionGate>
  );
}
