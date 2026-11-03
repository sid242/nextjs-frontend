import { errorResponse } from "./response";

/**
 * CSRF defence for cookie-authenticated requests (on top of SameSite=Lax):
 * the browser's Origin (or Sec-Fetch-Site) must match our own host.
 */
export function assertSameOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))
    ?.split(",")[0]
    ?.trim();

  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase().replace(/:(?:80|443)$/, "");
      const currentHost = host?.toLowerCase().replace(/:(?:80|443)$/, "");
      if (originHost === currentHost) return null;

      // In development mode, allow local testing via LAN IP (192.168.*, 10.*, 172.16-31.*) and dev tunnels
      if (process.env.NODE_ENV !== "production") {
        const originHostname = new URL(origin).hostname.toLowerCase();
        if (
          originHostname === "localhost" ||
          originHostname === "127.0.0.1" ||
          /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)\d+/.test(originHostname) ||
          originHostname.endsWith(".devtunnels.ms") ||
          originHostname.endsWith(".ngrok-free.app") ||
          originHostname.endsWith(".ngrok.io") ||
          originHostname.endsWith(".loca.lt")
        ) {
          return null;
        }
      }
    } catch {
      /* fall through */
    }
    return errorResponse(403, "FORBIDDEN_ORIGIN", "Cross-origin request blocked");
  }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return errorResponse(403, "FORBIDDEN_ORIGIN", "Cross-origin request blocked");
  }
  return null;
}

/**
 * Headers to propagate to the backend. X-Forwarded-For matters: without it the backend's
 * rate limiter would see EVERY user as the Next.js server's IP.
 */
export function forwardedHeaders(req: Request): Record<string, string | undefined> {
  const supportHeader = req.headers.get("x-support-session-id");
  const cookieMatch = req.headers.get("cookie")?.match(/(?:^|;\s*)support_session_id=([^;]+)/);
  const supportSession = supportHeader ?? cookieMatch?.[1] ?? undefined;

  return {
    "x-request-id": req.headers.get("x-request-id") ?? crypto.randomUUID(),
    "x-forwarded-for": req.headers.get("x-forwarded-for") ?? undefined,
    "user-agent": req.headers.get("user-agent") ?? undefined,
    "x-support-session-id": supportSession,
  };
}
