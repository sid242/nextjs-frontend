import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  const searchParams = req.nextUrl.searchParams;
  const page = searchParams.get("page") ?? "1";
  const limit = searchParams.get("limit") ?? "10";

  try {
    const upstream = await backendFetch(`/users/me/login-history?page=${page}&limit=${limit}`, {
      method: "GET",
      token,
      headers: forwardedHeaders(req),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { items: [], total: 0, page: 1, limit: 10, totalPages: 1 }, {
      status: upstream.status,
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }
}
