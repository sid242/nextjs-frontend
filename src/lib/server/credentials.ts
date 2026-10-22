import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { applyAuthCookies } from "@/lib/auth/cookies";

import { backendFetch } from "./backend";
import { assertSameOrigin, forwardedHeaders } from "./request";
import { errorResponse } from "./response";

/** Shared by /api/auth/login and /api/auth/register: tokens go into cookies, the browser only gets the user. */
export async function handleCredentials(
  req: NextRequest,
  backendPath:
    | "/auth/login"
    | "/auth/register"
    | "/auth/magic-link/verify"
    | "/tenants/invitations/accept"
    | string,
) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return errorResponse(400, "BAD_JSON", "Invalid request body");

  let upstream: Response;
  try {
    upstream = await backendFetch(backendPath, {
      method: "POST",
      json: body,
      headers: forwardedHeaders(req),
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }

  const data = (await upstream.json().catch(() => null)) as {
    user?: unknown;
    accessToken?: string;
    refreshToken?: string;
    error?: unknown;
    data?: { user?: unknown; accessToken?: string; refreshToken?: string };
  } | null;

  const authData = data?.data ?? data;

  if (!upstream.ok || !authData?.accessToken || !authData?.refreshToken) {
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) headers["Retry-After"] = retryAfter;
    return NextResponse.json(
      data?.error ? data : { error: { code: "UPSTREAM_ERROR", message: "Request failed" } },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers,
      },
    );
  }

  const res = NextResponse.json(
    { user: authData.user },
    { status: upstream.status, headers: { "Cache-Control": "no-store" } },
  );
  return applyAuthCookies(res, {
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  });
}
