export type HostClassification = "platform" | "subdomain" | "custom";

export interface HostInfo {
  classification: HostClassification;
  hostname: string;
  subdomain?: string;
}

export function normalizeHost(rawHost?: string | null): string {
  if (!rawHost) return "";
  let host = rawHost.trim().toLowerCase();
  // Strip port if present (e.g., localhost:3001 or acme.example.com:443)
  if (host.includes(":")) {
    host = host.split(":")[0] ?? host;
  }
  // Strip trailing dots
  return host.replace(/\.+$/, "");
}

/**
 * Classifies a normalized host into platform, subdomain, or custom domain.
 */
export function classifyHost(
  rawHost?: string | null,
  options?: {
    baseDomain?: string;
    platformHost?: string;
    reservedSubdomains?: string[] | string;
  },
): HostInfo {
  const hostname = normalizeHost(rawHost);

  const baseDomain = normalizeHost(
    options?.baseDomain || process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || "localhost:3001",
  );

  const platformHost = normalizeHost(
    options?.platformHost || process.env.PLATFORM_HOST || baseDomain,
  );

  const rawReserved =
    options?.reservedSubdomains ||
    process.env.RESERVED_SUBDOMAINS ||
    "www,api,app,admin,platform,auth,static,cdn,mail,status";

  const reservedList = Array.isArray(rawReserved)
    ? rawReserved.map((s) => s.trim().toLowerCase())
    : rawReserved.split(",").map((s) => s.trim().toLowerCase());

  // 1. Matches base domain or platform host directly
  if (!hostname || hostname === baseDomain || hostname === platformHost) {
    return { classification: "platform", hostname };
  }

  // 2. Subdomain of base domain (e.g., acme.example.com)
  if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
    const subdomain = hostname.slice(0, -(baseDomain.length + 1));
    if (subdomain && !subdomain.includes(".")) {
      if (reservedList.includes(subdomain)) {
        return { classification: "platform", hostname, subdomain };
      }
      return { classification: "subdomain", hostname, subdomain };
    }
  }

  // 3. Localhost development subdomain (e.g., acme.localhost or acme.local)
  if (hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    if (parts.length === 2 && parts[0]) {
      const subdomain = parts[0];
      if (reservedList.includes(subdomain)) {
        return { classification: "platform", hostname, subdomain };
      }
      return { classification: "subdomain", hostname, subdomain };
    }
  }

  // 4. Custom domain (e.g., portal.customer.com)
  return { classification: "custom", hostname };
}
