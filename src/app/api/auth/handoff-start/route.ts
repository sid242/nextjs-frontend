import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const token = req?.cookies?.get?.(ACCESS_COOKIE)?.value;
  if (!token) {
    return errorResponse(401, "UNAUTHORIZED", "Not signed in");
  }

  const body = (await req?.json?.().catch(() => null)) as {
    tenantId?: string;
    targetHost?: string;
    next?: string;
  } | null;

  if (!body?.tenantId || !body?.targetHost) {
    return errorResponse(400, "BAD_REQUEST", "tenantId and targetHost are required");
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/auth/handoff", {
      method: "POST",
      token,
      json: {
        tenantId: body?.tenantId,
        targetHost: body?.targetHost,
      },
      headers: forwardedHeaders(req),
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Failed to initiate session handoff");
  }

  const data = (await upstream?.json?.().catch(() => null)) as {
    data?: { handoffUrl?: string; code?: string };
    error?: unknown;
  } | null;

  if (!upstream?.ok || !data?.data?.handoffUrl) {
    return NextResponse.json(
      data?.error
        ? data
        : { error: { code: "HANDOFF_FAILED", message: "Failed to initiate session handoff" } },
      { status: upstream?.status || 500 },
    );
  }

  let finalHandoffUrl = data?.data?.handoffUrl;
  if (body?.next) {
    finalHandoffUrl += `&next=${encodeURIComponent(body.next)}`;
  }

  return NextResponse.json({ handoffUrl: finalHandoffUrl }, { status: 200 });
}
