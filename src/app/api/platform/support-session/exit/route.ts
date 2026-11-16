import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { decodeJwt } from "@/lib/auth/jwt";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;

  const decoded = accessToken ? (decodeJwt(accessToken) as Record<string, unknown> | null) : null;
  const sessionFromToken = decoded?.sess as string | undefined;

  const sessionId =
    (typeof body?.sessionId === "string" && body.sessionId.trim() ? body.sessionId.trim() : null) ??
    req.cookies.get(SUPPORT_SESSION_COOKIE)?.value ??
    sessionFromToken;

  const tokenToUse = staffToken || accessToken;

  if (sessionId && tokenToUse) {
    try {
      const upstream = await backendFetch(`/platform/support-sessions/${sessionId}/end`, {
        method: "POST",
        token: tokenToUse,
        headers: forwardedHeaders(req),
        json: {
          outcome: "Platform operator concluded delegated session via portal banner",
        },
      });
      if (!upstream.ok) {
        console.error(
          "Failed to end support session on backend:",
          upstream.status,
          await upstream.text().catch(() => ""),
        );
      }
    } catch (err) {
      console.error("Error ending support session:", err);
    }
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true, redirectUrl: "/platform/tenants" });

  res.cookies.set(SUPPORT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("active_tenant_id", "", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("ctx_slug", "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
