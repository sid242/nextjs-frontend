import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { TENANT_PATHS } from "@/config/routes";
import { getTenantUrlContext, tenantHref } from "@/lib/tenancy/urls";

interface PageProps {
  params: Promise<{
    tenantSlug: string;
  }>;
}

export default async function WhatsAppRedirectPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const context = getTenantUrlContext(await headers()) ?? getTenantUrlContext(tenantSlug);
  redirect(tenantHref(context, TENANT_PATHS.SETTINGS_INTEGRATIONS_WHATSAPP));
}
