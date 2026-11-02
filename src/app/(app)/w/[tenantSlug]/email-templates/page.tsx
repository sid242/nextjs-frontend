"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import { TemplatesTable } from "@/features/email-templates";
import { TENANT_PERMISSIONS, TenantPermissionGate } from "@/features/tenants";
import { useTenantHref } from "@/lib/tenancy";

export default function EmailTemplatesPage() {
  const tenantHref = useTenantHref();

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.TENANTS_READ}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeader
            title="Email Templates"
            description="Create, customize, and manage responsive email templates with dynamic merge variables and real-time device previews."
          />
          <Button asChild className="h-10 shrink-0 gap-2 rounded-xl px-4 font-semibold shadow-xs">
            <Link href={tenantHref("/email-templates/new")}>
              <PlusIcon className="size-4" />
              <span>New Email Template</span>
            </Link>
          </Button>
        </div>

        <TemplatesTable />
      </div>
    </TenantPermissionGate>
  );
}
