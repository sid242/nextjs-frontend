import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_GUARD_COOKIE } from "@/lib/auth/constants";
import { applyAuthCookies, clearAuthCookies, setRefreshGuard } from "@/lib/auth/cookies";
import { safeNextPath } from "@/lib/auth/paths";
import { assertSameOrigin } from "@/lib/server/request";
import { refreshTokens } from "@/lib/server/refresh";
import { errorResponse, redirectTo } from "@/lib/server/response";

export const dynamic = "force-dynamic";

/**
 * GET  (browser navigation): used by server components when the access token is missing/expired.
 *      Refreshes, then bounces back to `next`. Falls back to /login when the session is over.
 * POST (fetch from the API client): refreshes and answers 204 / 401.
 */
export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const loginUrl = `/login?next=${encodeURIComponent(next)}`;

  // Loop guard: if we refreshed seconds ago and still landed here, the backend rejected the new token.
  if (req.cookies.get(REFRESH_GUARD_COOKIE)) return clearAuthCookies(redirectTo(loginUrl));

  const result = await refreshTokens(req);
  if (result.ok) return setRefreshGuard(applyAuthCookies(redirectTo(next), result.tokens));
  if (result.reason === "invalid") return clearAuthCookies(redirectTo(loginUrl));
  return errorResponse(
    503,
    "UPSTREAM_UNAVAILABLE",
    "The service is temporarily unavailable. Please try again shortly.",
  );
}

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const result = await refreshTokens(req);
  if (result.ok) return applyAuthCookies(new NextResponse(null, { status: 204 }), result.tokens);
  if (result.reason === "invalid")
    return clearAuthCookies(errorResponse(401, "UNAUTHORIZED", "Session expired"));
  return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
}
