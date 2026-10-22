import { NextResponse, type NextRequest } from "next/server";

import { PLATFORM_STAFF_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  const sessionId = req.cookies.get(SUPPORT_SESSION_COOKIE)?.value;

  if (sessionId && staffToken) {
    await backendFetch(`/platform/support-sessions/${sessionId}/end`, {
      method: "POST",
      token: staffToken,
      headers: forwardedHeaders(req),
      body: JSON.stringify({
        outcome: "Platform operator concluded delegated session via portal banner",
      }),
    }).catch(() => undefined);
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true, redirectUrl: "/platform/support-sessions" });

  res.cookies.set(SUPPORT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
