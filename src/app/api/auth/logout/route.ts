import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Best effort: revoke server-side. Even if this fails we still clear the cookies below.
    await backendFetch("/auth/logout", {
      method: "POST",
      json: { refreshToken },
      headers: forwardedHeaders(req),
    }).catch(() => undefined);
  }
  return clearAuthCookies(
    new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } }),
  );
}
