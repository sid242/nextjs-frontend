import { NextResponse, type NextRequest } from "next/server";

import { backendFetch } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: { message: "Token parameter is required" } },
      { status: 400 },
    );
  }

  const res = await backendFetch(`/tenants/invitations/preview?token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
