import { type ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { TenantUrlProvider, type TenantUrlContextValue } from "@/lib/tenancy";
import { resolveTenantBySlug } from "@/lib/tenancy/resolve";

interface TenantSlugLayoutProps {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantSlugLayout({ children, params }: TenantSlugLayoutProps) {
  const { tenantSlug } = await params;
  const headerList = await headers();
  const cookieStore = await cookies();

  // Validate tenant access for authenticated customer sessions:
  // Prevent unauthorized cross-tenant URL tampering (e.g. Super Admin or stranger typing /w/:slug)
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const supportSessionId = cookieStore.get(SUPPORT_SESSION_COOKIE)?.value;
  const hasPlatformSession = cookieStore.has(PLATFORM_STAFF_COOKIE);

  if (accessToken && !supportSessionId) {
    const contextRes = await backendFetch(`/tenants/${tenantSlug}/context`, {
      token: accessToken,
    });
    if (contextRes.status === 403 || contextRes.status === 401) {
      redirect("/select-workspace");
    }
    if (contextRes.status === 404) {
      notFound();
    }
  }

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
    if (!resolution || resolution.kind !== "tenant") {
      notFound();
    }
    contextValue = {
      slug: tenantSlug,
      mode: (resolution?.urlMode as "path" | "subdomain" | "customDomain") ?? "path",
      canonicalBase: resolution?.canonicalBase ?? "",
      allowed: resolution?.allowed,
    };
  }

  return (
    <TenantUrlProvider value={{ ...contextValue, hasPlatformSession }}>
      {children}
    </TenantUrlProvider>
  );
}
