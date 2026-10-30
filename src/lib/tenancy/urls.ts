export interface TenantUrlContextValue {
  slug: string;
  mode: "path" | "subdomain" | "customDomain";
  canonicalBase: string;
  allowed?: {
    path: true;
    subdomain: boolean;
    customDomain: boolean;
  };
}

/**
 * Generates an internal href for a tenant page according to its active URL mode.
 * - On path host: /w/{slug}/dashboard
 * - On subdomain or custom domain host: /dashboard (unprefixed)
 */
export function tenantHref(
  ctx: TenantUrlContextValue | null | undefined,
  path = "/dashboard",
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!ctx || !ctx.slug || ctx.mode === "path") {
    const slug = ctx?.slug ? encodeURIComponent(ctx.slug) : "";
    return slug ? `/w/${slug}${cleanPath}` : cleanPath;
  }
  return cleanPath;
}

/**
 * Builds an absolute canonical URL to a tenant resource.
 */
export function absoluteTenantUrl(canonicalBase: string, path = "/"): string {
  const cleanBase = canonicalBase.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
