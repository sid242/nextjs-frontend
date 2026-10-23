import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { handleImpersonateRequest, handleStopImpersonateRequest } from "@/lib/server/impersonation";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

const PASSTHROUGH_HEADERS = [
  "content-type",
  "retry-after",
  "x-request-id",
  "ratelimit",
  "ratelimit-policy",
];
const MAX_BODY_BYTES = 1_000_000; // matches the backend's 1mb JSON limit; uploads go straight to S3

/**
 * Same-origin gateway from the browser to the backend API. It turns the httpOnly access cookie into a
 * Bearer token, forwards the client IP, and routes authentication actions to dedicated BFF session handlers.
 */
async function handler(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  const upstreamPath = `/${path.map(encodeURIComponent).join("/")}`;

  if (upstreamPath === "/auth/impersonate") {
    return handleImpersonateRequest(req);
  }
  if (upstreamPath === "/auth/stop-impersonate") {
    return handleStopImpersonateRequest(req);
  }
  if (upstreamPath === "/auth" || upstreamPath.startsWith("/auth/")) {
    return errorResponse(404, "NOT_FOUND", "Not found");
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const blocked = assertSameOrigin(req);
    if (blocked) return blocked;
  }

  const isPlatformAuth =
    upstreamPath === "/platform/auth/login" || upstreamPath === "/platform/auth/logout";

  const token =
    req.cookies.get(ACCESS_COOKIE)?.value ?? req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!token && !isPlatformAuth) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
    if (body && body.length > MAX_BODY_BYTES)
      return errorResponse(413, "PAYLOAD_TOO_LARGE", "Payload too large");
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(upstreamPath, {
      method: req.method,
      token,
      search: req.nextUrl.search,
      body: body || undefined,
      headers: { ...forwardedHeaders(req), "content-type": body ? "application/json" : undefined },
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
