import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ROUTES } from "@/config/routes";
import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

const sessionSchema = z.object({ sessionId: z.string().guid() });
const upstreamSchema = z.object({
  data: z.object({
    token: z.string().min(1),
    tenantId: z.string().guid(),
    tenantSlug: z.string().regex(/^[a-z0-9-]+$/),
    expiresAt: z.string().datetime({ offset: true }),
  }),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!staffToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in as platform staff");

  const body = sessionSchema.safeParse(await req.json().catch(() => null));
  if (!body.success)
    return errorResponse(400, "INVALID_SESSION_ID", "A valid session ID is required");

  try {
    const { sessionId } = body.data;
    const upstream = await backendFetch(`/platform/support-sessions/${sessionId}/enter`, {
      method: "POST",
      token: staffToken,
      headers: forwardedHeaders(req),
    });
    if (!upstream.ok) {
      return errorResponse(
        upstream.status,
        "SUPPORT_ENTRY_DENIED",
        "Could not enter this support session",
      );
    }

    const result = upstreamSchema.safeParse(await upstream.json());
    if (!result.success) {
      return errorResponse(502, "INVALID_SUPPORT_SESSION", "Invalid support session response");
    }

    const { token, tenantId, tenantSlug, expiresAt } = result.data.data;
    const remainingMs = Date.parse(expiresAt) - Date.now();
    if (remainingMs <= 0)
      return errorResponse(401, "SUPPORT_EXPIRED", "Support session has expired");

    const response = NextResponse.json({ redirectUrl: ROUTES.tenant(tenantSlug).DASHBOARD });
    const cookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
      sameSite: "lax",
      path: "/",
    } as const;
    response.cookies.set(SUPPORT_SESSION_COOKIE, sessionId, { ...cookie, maxAge: 2 * 60 * 60 });
    const maxAge = Math.ceil(remainingMs / 1000);
    response.cookies.set(ACCESS_COOKIE, token, { ...cookie, maxAge });
    response.cookies.set("active_tenant_id", tenantId, { ...cookie, httpOnly: false, maxAge });
    response.cookies.set("ctx_slug", tenantSlug, { ...cookie, maxAge });

    return response;
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
