import "server-only";

import { backendFetch } from "./backend";

export interface ResolvedTenantBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  borderRadius?: string | null;
  customDomain?: string | null;
  supportEmail?: string | null;
  [key: string]: unknown;
}

export interface PublicTenantResolution {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  branding: ResolvedTenantBranding;
}

/**
 * Server-only tenant branding resolver for SSR layouts and Auth pages.
 * Resolves by Host header, custom domain, or URL slug with upstream Redis caching.
 */
export async function resolvePublicTenant(options: {
  slug?: string;
  domain?: string;
  host?: string;
}): Promise<PublicTenantResolution | null> {
  const params = new URLSearchParams();
  if (options?.slug?.trim()) params.set("slug", options.slug.trim());
  if (options?.domain?.trim()) params.set("domain", options.domain.trim());
  if (options?.host?.trim()) params.set("host", options.host.trim());

  if (params.size === 0) return null;

  try {
    const res = await backendFetch("/tenants/public/resolve", {
      search: `?${params.toString()}`,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: PublicTenantResolution };
    return json?.data ?? null;
  } catch {
    return null;
  }
}
