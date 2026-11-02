import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { applyAuthCookies } from "@/lib/auth/cookies";
import { safeNextPath } from "@/lib/auth/paths";
import { backendFetch } from "@/lib/server/backend";
import { forwardedHeaders } from "@/lib/server/request";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = req?.url;
  const failRedirect = () =>
    NextResponse.redirect(new URL("/login?error=handoff_failed", requestUrl), 303);

  const searchParams = req?.nextUrl?.searchParams;
  const code = searchParams?.get?.("code");
  const next = searchParams?.get?.("next");
  const host = req?.headers?.get?.("x-forwarded-host") || req?.headers?.get?.("host") || "";

  if (!code) {
    return failRedirect();
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/auth/handoff/redeem", {
      method: "POST",
      json: { code, host },
      headers: forwardedHeaders(req),
    });
  } catch {
    return failRedirect();
  }

  if (!upstream?.ok) {
    return failRedirect();
  }

  const data = (await upstream?.json?.().catch(() => null)) as {
    data?: {
      accessToken: string;
      refreshToken: string;
      tenantId?: string;
      memberships?: Array<{ tenantId: string; slug: string }>;
    };
  } | null;

  const authData = data?.data;
  if (!authData?.accessToken || !authData?.refreshToken) {
    return failRedirect();
  }

  const redirectTarget = safeNextPath(next);
  const res = NextResponse.redirect(new URL(redirectTarget, requestUrl), 303);

  // Apply auth cookies
  applyAuthCookies(res, {
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  });

  // Set ctx_slug cookie for legacy path redirects
  const activeTenant = authData?.memberships?.find?.((m) => m?.tenantId === authData?.tenantId);
  const activeSlug = activeTenant?.slug || authData?.memberships?.[0]?.slug;
  if (activeSlug) {
    const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
    res?.cookies?.set?.("ctx_slug", activeSlug, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return res;
}
