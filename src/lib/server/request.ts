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
      if (new URL(origin).host === host) return null;
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
  return {
    "x-request-id": req.headers.get("x-request-id") ?? crypto.randomUUID(),
    "x-forwarded-for": req.headers.get("x-forwarded-for") ?? undefined,
    "user-agent": req.headers.get("user-agent") ?? undefined,
    "x-tenant-id": req.headers.get("x-tenant-id") ?? undefined,
  };
}
