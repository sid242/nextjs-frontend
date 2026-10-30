import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { handleImpersonateRequest, handleStopImpersonateRequest } from "@/lib/server/impersonation";
import {
  handlePlatform2FaVerifyRequest,
  handlePlatformLoginRequest,
  handlePlatformLogoutRequest,
} from "@/lib/server/platform-auth";
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
 * Bearer token, forwards the client IP, routes authentication actions to dedicated BFF session handlers,
 * and isolates platform staff credentials from customer tenant credentials.
 */
async function handler(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  const upstreamPath = `/${path.map(encodeURIComponent).join("/")}`;

  // Impersonation handlers
  if (upstreamPath === "/auth/impersonate") {
    return handleImpersonateRequest(req);
  }
  if (upstreamPath === "/auth/stop-impersonate") {
    return handleStopImpersonateRequest(req);
  }

  // Tenant customer auth must use dedicated /api/auth routes
  if (upstreamPath === "/auth" || upstreamPath.startsWith("/auth/")) {
    return errorResponse(404, "NOT_FOUND", "Not found");
  }

  // Dedicated Platform auth route delegates (Finding 1)
  if (upstreamPath === "/platform/auth/login") {
    return handlePlatformLoginRequest(req);
  }
  if (upstreamPath === "/platform/auth/2fa/verify") {
    return handlePlatform2FaVerifyRequest(req);
  }
  if (upstreamPath === "/platform/auth/logout") {
    return handlePlatformLogoutRequest(req);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const blocked = assertSameOrigin(req);
    if (blocked) return blocked;
  }

  // Finding 2 Fix: Route-aware credential selection.
  // /platform/* and /plans/platform routes strictly require the platform staff cookie, preventing
  // a customer tenant session cookie from mistakenly masking or replacing staff credentials.
  const isPlatformRoute =
    upstreamPath === "/platform" ||
    upstreamPath.startsWith("/platform/") ||
    upstreamPath === "/plans/platform" ||
    upstreamPath.startsWith("/plans/platform/") ||
    upstreamPath === "/billing/platform" ||
    upstreamPath.startsWith("/billing/platform/");

  const isPublicRoute =
    upstreamPath === "/plans" ||
    upstreamPath === "/public/plans" ||
    upstreamPath === "/billing" ||
    upstreamPath.startsWith("/tenants/public/");

  const token = isPlatformRoute
    ? req.cookies.get(PLATFORM_STAFF_COOKIE)?.value
    : req.cookies.get(ACCESS_COOKIE)?.value;

  if (!token && !isPublicRoute) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  // Finding 3 Fix: Bounded, byte-accurate body length validation.
  // UTF-16 string .length miscalculates multibyte characters; we check Content-Length header
  // and arrayBuffer.byteLength against the exact 1MB threshold.
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const parsedLength = parseInt(contentLengthHeader, 10);
      if (!Number.isNaN(parsedLength) && parsedLength > MAX_BODY_BYTES) {
        return errorResponse(413, "PAYLOAD_TOO_LARGE", "Payload too large");
      }
    }

    const arrayBuffer = await req.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BODY_BYTES) {
      return errorResponse(413, "PAYLOAD_TOO_LARGE", "Payload too large");
    }
    if (arrayBuffer.byteLength > 0) {
      body = new TextDecoder().decode(arrayBuffer);
    }
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

// Finding 4 Fix: Export HEAD alongside standard HTTP methods
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
};
