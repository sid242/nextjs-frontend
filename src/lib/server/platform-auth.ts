import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { PLATFORM_STAFF_COOKIE } from "@/lib/auth/constants";
import { applyPlatformStaffCookie, clearPlatformStaffCookie } from "@/lib/auth/cookies";

import { backendFetch } from "./backend";
import { assertSameOrigin, forwardedHeaders } from "./request";
import { errorResponse } from "./response";

function extractCookieValue(header: string | null, cookieName: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

/**
 * Dedicated BFF handler for platform staff login:
 * Upstream staff JWT is captured and set as a strict httpOnly cookie.
 * Only safe staff profile and 2FA challenge data are returned in the JSON response,
 * ensuring raw tokens are never exposed to browser JavaScript (XSS hardening).
 */
export async function handlePlatformLoginRequest(req: NextRequest): Promise<Response> {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse(400, "BAD_JSON", "Invalid request body");
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/platform/auth/login", {
      method: "POST",
      json: body,
      headers: forwardedHeaders(req),
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }

  const data = (await upstream.json().catch(() => null)) as {
    staff?: unknown;
    token?: string;
    twoFactorRequired?: boolean;
    challengeToken?: string;
    method?: string;
    error?: unknown;
    data?: {
      staff?: unknown;
      token?: string;
      twoFactorRequired?: boolean;
      challengeToken?: string;
      method?: string;
    };
  } | null;

  const authData = data?.data ?? data;

  // 1. Intercept two-factor authentication challenge
  if (upstream.ok && authData?.twoFactorRequired) {
    return NextResponse.json(
      {
        twoFactorRequired: true,
        challengeToken: authData.challengeToken,
        method: authData.method ?? "totp",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // 2. Extract staff token from Set-Cookie header or upstream payload
  const setCookie = upstream.headers.get("set-cookie");
  const cookieToken = extractCookieValue(setCookie, PLATFORM_STAFF_COOKIE);
  const token = cookieToken || authData?.token;

  if (!upstream.ok || !token) {
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) headers["Retry-After"] = retryAfter;
    return NextResponse.json(
      data?.error
        ? data
        : { error: { code: "UPSTREAM_ERROR", message: "Platform authentication failed" } },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers,
      },
    );
  }

  // 3. Return sanitized staff information and write httpOnly cookie
  const res = NextResponse.json(
    { staff: authData?.staff },
    { status: upstream.status, headers: { "Cache-Control": "no-store" } },
  );
  return applyPlatformStaffCookie(res, token);
}

/**
 * Dedicated BFF handler for platform staff 2FA challenge verification.
 */
export async function handlePlatform2FaVerifyRequest(req: NextRequest): Promise<Response> {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse(400, "BAD_JSON", "Invalid request body");
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/platform/auth/2fa/verify", {
      method: "POST",
      json: body,
      headers: forwardedHeaders(req),
    });
  } catch {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Service temporarily unavailable");
  }

  const data = (await upstream.json().catch(() => null)) as {
    staff?: unknown;
    token?: string;
    error?: unknown;
    data?: {
      staff?: unknown;
      token?: string;
    };
  } | null;

  const authData = data?.data ?? data;
  const setCookie = upstream.headers.get("set-cookie");
  const cookieToken = extractCookieValue(setCookie, PLATFORM_STAFF_COOKIE);
  const token = cookieToken || authData?.token;

  if (!upstream.ok || !token) {
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    return NextResponse.json(
      data?.error
        ? data
        : { error: { code: "UPSTREAM_ERROR", message: "Two-factor verification failed" } },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers,
      },
    );
  }

  const res = NextResponse.json(
    { staff: authData?.staff },
    { status: upstream.status, headers: { "Cache-Control": "no-store" } },
  );
  return applyPlatformStaffCookie(res, token);
}

/**
 * Dedicated BFF handler for platform staff logout.
 */
export async function handlePlatformLogoutRequest(req: NextRequest): Promise<Response> {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const staffToken = req.cookies.get(PLATFORM_STAFF_COOKIE)?.value;
  if (staffToken) {
    try {
      await backendFetch("/platform/auth/logout", {
        method: "POST",
        token: staffToken,
        headers: forwardedHeaders(req),
      });
    } catch {
      // Ignore upstream failure during logout, clear local cookie regardless
    }
  }

  const res = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  return clearPlatformStaffCookie(res);
}
