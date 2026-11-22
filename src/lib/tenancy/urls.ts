export interface TenantUrlContextValue {
  slug: string;
  mode: "path" | "subdomain" | "customDomain";
  canonicalBase: string;
  hasPlatformSession?: boolean;
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
 * Extracts TenantUrlContextValue from incoming request headers or a string slug.
 * Useful in Server Components and route handlers.
 */
export function getTenantUrlContext(
  headersOrSlug?: { get: (name: string) => string | null } | string | null,
): TenantUrlContextValue | null {
  if (!headersOrSlug) return null;
  if (typeof headersOrSlug === "string") {
    return {
      slug: headersOrSlug,
      mode: "path",
      canonicalBase: "",
    };
  }
  const slug = headersOrSlug.get("x-tenant-slug");
  if (!slug) return null;
  const rawMode = headersOrSlug.get("x-tenant-mode");
  const mode =
    rawMode === "subdomain" || rawMode === "customDomain" || rawMode === "path" ? rawMode : "path";
  const canonicalBase = headersOrSlug.get("x-tenant-canonical") ?? "";
  return {
    slug,
    mode,
    canonicalBase,
  };
}

/**
 * Builds an absolute canonical URL to a tenant resource.
 */
export function absoluteTenantUrl(canonicalBase: string, path = "/"): string {
  const cleanBase = canonicalBase.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
