import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { assertSameOrigin } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!staffToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in as platform staff");

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sessionId = body?.sessionId;
  const tenantId = body?.tenantId;
  const accessToken = body?.accessToken;

  if (!sessionId || typeof sessionId !== "string") {
    return errorResponse(400, "INVALID_SESSION_ID", "sessionId is required");
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true, redirectUrl: "/dashboard" });

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

  if (tenantId && typeof tenantId === "string") {
    res.cookies.set("active_tenant_id", tenantId, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
  }

  return res;
}
