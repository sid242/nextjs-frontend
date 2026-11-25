import { NextResponse, type NextRequest } from "next/server";

import { PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import { assertSameOrigin } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";
import { resolveClientSocketUrl } from "@/lib/server/socket-url";

export const dynamic = "force-dynamic";

/**
 * Issues a Socket.IO handshake ticket for authenticated platform staff sessions.
 */
export async function GET(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const token = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!token) {
    return errorResponse(401, "UNAUTHORIZED", "Platform staff authentication required");
  }

  return NextResponse.json(
    { token, url: resolveClientSocketUrl(req) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
