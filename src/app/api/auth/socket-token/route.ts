import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { applyAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/server/env";
import { refreshTokens } from "@/lib/server/refresh";
import { assertSameOrigin } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

/**
 * Socket.IO connects from the browser straight to the backend, so JS needs a token it can't read from
 * the httpOnly cookie. We hand out the current (short-lived) access token, refreshing first if needed.
 * Trade-off: this one token is reachable by page JS. Keep access-token TTL short (15m by default).
 */
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const url = getEnv().SOCKET_URL;
  const headers = { "Cache-Control": "no-store" };

  const current = req.cookies.get(ACCESS_COOKIE)?.value;
  if (current) return NextResponse.json({ token: current, url }, { headers });

  const result = await refreshTokens(req);
  if (result.ok) {
    return applyAuthCookies(
      NextResponse.json({ token: result.tokens.accessToken, url }, { headers }),
      result.tokens,
    );
  }
  if (result.reason === "invalid")
    return clearAuthCookies(errorResponse(401, "UNAUTHORIZED", "Session expired"));
  return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
}
