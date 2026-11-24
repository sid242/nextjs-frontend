import { NextResponse, type NextRequest } from "next/server";

import { PLATFORM_ROUTES } from "@/config/routes";
import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { decodeJwt } from "@/lib/auth/jwt";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const sessionId = req.cookies.get(SUPPORT_SESSION_COOKIE)?.value;
  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const claims = accessToken ? decodeJwt(accessToken) : null;
  const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
  if (sessionId && body?.sessionId !== sessionId) {
    return errorResponse(409, "SUPPORT_SESSION_CHANGED", "Another session is active");
  }

  if (sessionId && staffToken && claims?.typ === "SUPPORT" && claims.sess === sessionId) {
    try {
      const upstream = await backendFetch(
        `/platform/support-sessions/${encodeURIComponent(sessionId)}/end`,
        {
          method: "POST",
          token: staffToken,
          headers: forwardedHeaders(req),
          json: { outcome: "Operator exited the delegated workspace" },
        },
      );
      if (!upstream.ok && ![401, 404].includes(upstream.status)) {
        return errorResponse(
          upstream.status,
          "SUPPORT_EXIT_FAILED",
          "Could not end this support session",
        );
      }
    } catch {
      return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
    }
  }

  const response = NextResponse.json({
    redirectUrl: staffToken ? PLATFORM_ROUTES.SUPPORT_SESSIONS : PLATFORM_ROUTES.LOGIN,
  });
  if (sessionId) {
    response.cookies.delete(SUPPORT_SESSION_COOKIE);
    if (!accessToken || (claims?.typ === "SUPPORT" && claims.sess === sessionId)) {
      for (const name of [ACCESS_COOKIE, "active_tenant_id", "ctx_slug"]) {
        response.cookies.delete(name);
      }
    }
  }
  return response;
}
