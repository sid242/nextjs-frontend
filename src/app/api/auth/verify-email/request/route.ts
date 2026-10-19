import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const body: unknown = await req.json().catch(() => null);

  try {
    const upstream = await backendFetch("/auth/verify-email/request", {
      method: "POST",
      token,
      json: body && typeof body === "object" ? body : {},
      headers: forwardedHeaders(req),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Verification email sent if registered" }, {
      status: upstream.status,
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
