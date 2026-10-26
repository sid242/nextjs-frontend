import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const currentToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!currentToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  try {
    const upstream = await backendFetch("/auth/2fa/setup", {
      method: "POST",
      token: currentToken,
      headers: forwardedHeaders(req),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { error: { message: "Failed to generate 2FA secret" } }, {
      status: upstream.status,
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
