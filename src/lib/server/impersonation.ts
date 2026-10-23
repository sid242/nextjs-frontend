import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  IMPERSONATOR_BACKUP_COOKIE,
  PLATFORM_STAFF_COOKIE,
} from "@/lib/auth/constants";
import { backendFetch } from "@/lib/server/backend";
import { assertSameOrigin, forwardedHeaders } from "@/lib/server/request";
import { errorResponse } from "@/lib/server/response";

export async function handleImpersonateRequest(req: NextRequest): Promise<Response> {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const currentToken =
    req.cookies.get(ACCESS_COOKIE)?.value ?? req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (!currentToken) return errorResponse(401, "UNAUTHORIZED", "Not signed in");

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse(400, "BAD_JSON", "Invalid request body");
  }

  const raw = body as Record<string, unknown>;
  const targetUserId = String(raw?.targetUserId ?? raw?.userId ?? "");
  if (!targetUserId) {
    return errorResponse(400, "INVALID_TARGET", "targetUserId is required");
  }

  const reason =
    typeof raw?.reason === "string" && raw.reason.trim().length >= 5
      ? raw.reason.trim()
      : "Administrative support and investigation";

  const durationMinutes =
    typeof raw?.durationMinutes === "number" &&
    raw.durationMinutes >= 5 &&
    raw.durationMinutes <= 120
      ? raw.durationMinutes
      : 30;

  let upstream: Response;
  try {
    upstream = await backendFetch("/auth/impersonate", {
      method: "POST",
      token: currentToken,
      json: {
        targetUserId,
        reason,
        durationMinutes,
      },
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

export async function handleStopImpersonateRequest(req: NextRequest): Promise<Response> {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const currentToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const adminBackupToken = req.cookies.get(IMPERSONATOR_BACKUP_COOKIE)?.value;

  if (!adminBackupToken) {
    return errorResponse(400, "NOT_IMPERSONATING", "No active impersonation session");
  }

  // Notify backend to clean up session in Redis
  if (currentToken) {
    await backendFetch("/auth/stop-impersonate", {
      method: "POST",
      token: currentToken,
      headers: forwardedHeaders(req),
    }).catch(() => undefined);
  }

  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  const res = NextResponse.json({ ok: true });

  // Restore the admin's original access token
  res.cookies.set(ACCESS_COOKIE, adminBackupToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Clear the backup cookie
  res.cookies.set(IMPERSONATOR_BACKUP_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
