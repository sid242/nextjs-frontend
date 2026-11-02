import "server-only";

import { classifyHost, normalizeHost } from "@/lib/tenancy/host";
import { resolveTenantByHost, resolveTenantBySlug } from "@/lib/tenancy/resolve";

/**
 * Derives the tenant ID for API calls strictly from the request Host or Referer.
 * Never trusts any client/browser-supplied x-tenant-id header.
 */
export async function tenantIdFromRequest(req: Request): Promise<string | undefined> {
  const host =
    (process.env.TRUST_PROXY === "true" ? req?.headers?.get?.("x-forwarded-host") : null) ??
    req?.headers?.get?.("host");

  if (!host) return undefined;

  const hostInfo = classifyHost(host);

  // 1. Subdomain or custom domain: derive tenant strictly from host
  if (hostInfo?.classification === "subdomain" || hostInfo?.classification === "custom") {
    try {
      const resolution = await resolveTenantByHost(host);
      return resolution?.tenantId ?? undefined;
    } catch {
      return undefined;
    }
  }

  // 2. Platform host: derive from Referer path /w/{slug}/...
  if (hostInfo?.classification === "platform") {
    const referer = req?.headers?.get?.("referer");
    if (!referer) return undefined;

    try {
      const refererUrl = new URL(referer);
      const reqHostNormalized = normalizeHost(host);
      const refererHostNormalized = normalizeHost(refererUrl?.host);

      // Validate referer origin must match the request host
      if (reqHostNormalized !== refererHostNormalized) {
        return undefined;
      }

      // Parse /w/{slug} from the Referer pathname
      const match = refererUrl?.pathname?.match?.(/^\/w\/([^/]+)/);
      if (match?.[1]) {
        const slug = decodeURIComponent(match[1]);
        const resolution = await resolveTenantBySlug(slug);
        return resolution?.tenantId ?? undefined;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}
