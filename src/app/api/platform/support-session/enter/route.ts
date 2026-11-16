import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!staffToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in as platform staff");

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sessionId = body?.sessionId;
  let accessToken = (body?.accessToken || body?.token) as string | undefined;
  let tenantId = body?.tenantId as string | undefined;
  let slug = (body?.slug || body?.tenantSlug) as string | undefined;

  if (!sessionId || typeof sessionId !== "string") {
    return errorResponse(400, "INVALID_SESSION_ID", "sessionId is required");
  }

  // If no accessToken was provided, call upstream backend to enter the session and generate the token
  if (!accessToken) {
    try {
      const upstream = await backendFetch(`/platform/support-sessions/${sessionId}/enter`, {
        method: "POST",
        token: staffToken,
        headers: forwardedHeaders(req),
      });

      if (upstream.ok) {
        const data = (await upstream.json().catch(() => null)) as {
          data?: {
            token?: string;
            accessToken?: string;
            tenantSlug?: string;
            tenantId?: string;
          };
          token?: string;
          tenantSlug?: string;
          tenantId?: string;
        } | null;

        const payload = (data?.data ?? data) as {
          token?: string;
          accessToken?: string;
          tenantSlug?: string;
          tenantId?: string;
        } | null;
        accessToken = payload?.token ?? payload?.accessToken;
        if (!slug && payload?.tenantSlug) slug = payload.tenantSlug;
        if (!tenantId && payload?.tenantId) tenantId = payload.tenantId;
      }
    } catch {
      // Fallback
    }
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const redirectUrl = slug ? `/w/${slug}/dashboard` : "/dashboard";
  const res = NextResponse.json({ ok: true, redirectUrl });

  res.cookies.set(SUPPORT_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60, // 2 hours
  });

  if (accessToken && typeof accessToken === "string") {
    res.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
  }

  if (tenantId) {
    res.cookies.set("active_tenant_id", tenantId, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
  }

  if (slug) {
    res.cookies.set("ctx_slug", slug, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
  }

  return res;
}
