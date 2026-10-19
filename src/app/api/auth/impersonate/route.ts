import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, IMPERSONATOR_BACKUP_COOKIE } from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const currentToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!currentToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse(400, "BAD_JSON", "Invalid request body");
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/auth/impersonate", {
      method: "POST",
      token: currentToken,
      json: body,
      headers: forwardedHeaders(req),
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }

  const data = (await upstream.json().catch(() => null)) as {
    data?: { accessToken?: string };
    accessToken?: string;
    error?: unknown;
  } | null;

  const accessToken = data?.data?.accessToken ?? data?.accessToken;

  if (!upstream.ok || !accessToken) {
    return NextResponse.json(
      data?.error
        ? data
        : { error: { code: "IMPERSONATE_FAILED", message: "Failed to impersonate" } },
      { status: upstream.status },
    );
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true });

  // Backup the admin's original token in imp_at
  res.cookies.set(IMPERSONATOR_BACKUP_COOKIE, currentToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // 1 hour max impersonation window
  });

  // Switch at to the impersonated user's token
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  return res;
}
