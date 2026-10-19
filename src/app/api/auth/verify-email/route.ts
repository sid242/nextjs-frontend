import { NextResponse, type NextRequest } from "next/server";

import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse(400, "BAD_JSON", "Invalid request body");
  }

  try {
    const upstream = await backendFetch("/auth/verify-email/confirm", {
      method: "POST",
      json: body,
      headers: forwardedHeaders(req),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Email verified successfully" }, {
      status: upstream.status,
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
