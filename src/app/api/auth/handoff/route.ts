import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES, ROUTES, TENANT_PATHS } from "@/config/routes";
import { applyAuthCookies } from "@/lib/auth/cookies";
import { isPlatformPath, safeNextPath, tenantSlugFromPath } from "@/lib/auth/paths";
import { backendFetch } from "@/lib/server/backend";
import { forwardedHeaders } from "@/lib/server/request";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = req?.url;
  const failRedirect = () =>
    new NextResponse(null, {
      status: 303,
      headers: { Location: AUTH_ROUTES.LOGIN + "?error=handoff_failed" },
    });

  const searchParams = req?.nextUrl?.searchParams;
  const code = searchParams?.get?.("code");
  const next = searchParams?.get?.("next");
  const requestHeaders = forwardedHeaders(req);
  const host =
    (
      (process.env.TRUST_PROXY === "true" ? req.headers.get("x-forwarded-host") : null) ??
      req.headers.get("host") ??
      req.nextUrl.host
    )
      .split(",")[0]
      ?.trim() ?? "";

  if (!code) {
    return failRedirect();
  }

  let upstream: Response;
  try {
    upstream = await backendFetch("/auth/handoff/redeem", {
      method: "POST",
      json: { code, host },
      headers: requestHeaders,
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
      memberships?: Array<{ tenantId: string; slug: string; canonicalBase?: string }>;
    };
  } | null;

  const authData = data?.data;
  if (!authData?.accessToken || !authData?.refreshToken) {
    return failRedirect();
  }

  const membership = authData.memberships?.find((item) => item.tenantId === authData.tenantId);
  const canonical =
    membership?.canonicalBase && URL.canParse(membership.canonicalBase)
      ? new URL(membership.canonicalBase)
      : null;
  const fallback =
    membership && canonical && (canonical.host !== host || canonical.pathname.startsWith("/w/"))
      ? ROUTES.tenant(membership.slug).DASHBOARD
      : TENANT_PATHS.DASHBOARD;
  const candidate = safeNextPath(next, fallback);
  const parsed = new URL(candidate, requestUrl);
  const nextTenant = tenantSlugFromPath(parsed.pathname);
  const redirectTarget =
    isPlatformPath(parsed.pathname) ||
    (membership && nextTenant !== null && nextTenant !== membership.slug)
      ? fallback
      : candidate;
  // The public request host can differ from the Next.js runtime host behind a proxy.
  const res = new NextResponse(null, { status: 303, headers: { Location: redirectTarget } });

  // Apply auth cookies
  applyAuthCookies(res, {
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  });

  return res;
}
