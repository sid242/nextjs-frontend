import { type ReactNode } from "react";
import { headers } from "next/headers";

import { TenantUrlProvider, type TenantUrlContextValue } from "@/lib/tenancy";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

interface TenantSlugLayoutProps {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantSlugLayout({ children, params }: TenantSlugLayoutProps) {
  const { tenantSlug } = await params;
  const headerList = await headers();

  const headerSlug = headerList.get("x-tenant-slug");
  const headerMode = headerList.get("x-tenant-mode") as
    "path" | "subdomain" | "customDomain" | null;
  const headerCanonical = headerList.get("x-tenant-canonical");

  let contextValue: TenantUrlContextValue;

  if (headerSlug && headerMode && headerCanonical) {
    contextValue = {
      slug: headerSlug,
      mode: headerMode,
      canonicalBase: headerCanonical,
    };
  } else {
    // Path mode on platform host
    const resolution = await resolveTenantBySlug(tenantSlug);
    contextValue = {
      slug: tenantSlug,
      mode: (resolution?.urlMode as "path" | "subdomain" | "customDomain") ?? "path",
      canonicalBase: resolution?.canonicalBase ?? "",
      allowed: resolution?.allowed,
    };
  }

  return <TenantUrlProvider value={contextValue}>{children}</TenantUrlProvider>;
}
