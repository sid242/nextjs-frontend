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

/** Check if hostname is a raw IP address or development tunnel (never a tenant custom domain) */
export function isIpOrDevHost(hostname: string): boolean {
  if (!hostname) return false;
  // IPv4: e.g. 192.168.1.45, 127.0.0.1, 10.0.0.1
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  // IPv6: e.g. ::1, [::1]
  if (hostname.includes(":") || hostname === "[::1]" || hostname === "::1") return true;
  // Dev Tunnels / ngrok / localtunnel (development port forwarding)
  if (
    hostname.endsWith(".devtunnels.ms") ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok.io") ||
    hostname.endsWith(".loca.lt")
  ) {
    return true;
  }
  return false;
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

  // 1b. Direct IP address or development tunnel access (e.g., 192.168.x.x, *.devtunnels.ms)
  // An IP address is never a custom tenant domain (custom domains require DNS CNAME records).
  if (isIpOrDevHost(hostname)) {
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
