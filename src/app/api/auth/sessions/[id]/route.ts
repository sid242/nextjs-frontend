import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const { id } = await params;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  try {
    const upstream = await backendFetch(`/auth/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
      headers: forwardedHeaders(req),
    });
    return new NextResponse(null, { status: upstream.status });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
