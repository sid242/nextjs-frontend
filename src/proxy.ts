import { NextResponse, type NextRequest } from "next/server";

import { PLATFORM_ROUTES } from "@/config/routes";
import {
  ACCESS_COOKIE,
  PLATFORM_STAFF_COOKIE,
  REFRESH_COOKIE,
  SUPPORT_SESSION_COOKIE,
} from "@/lib/auth/constants";
import { decodeJwt } from "@/lib/auth/jwt";
import {
  isAuthPage,
  isPlatformLogin,
  isPlatformPath,
  isProtectedPath,
  safeNextPath,
  tenantSlugFromPath,
} from "@/lib/auth/paths";
import { classifyHost, isIpAddress, normalizeHost } from "@/lib/tenancy/host";
import { resolveTenantByHost, resolveTenantBySlug } from "@/lib/tenancy/resolve";

const isDev = process.env.NODE_ENV !== "production";

function isTokenNonExpired(token?: string | null): boolean {
  if (!token) return false;
  const claims = decodeJwt(token);
  if (claims?.exp) {
    return claims.exp * 1000 > Date.now();
  }
  return token.length > 0;
}

/** CSP connect-src needs the Socket.IO origin in both http(s) and ws(s) flavours. */
function socketOrigins(rawHost?: string | null): string[] {
  const origins = new Set<string>();
  const raw = process.env.SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
  if (raw) {
    try {
      const url = new URL(raw);
      const ws = url.protocol === "https:" ? "wss:" : "ws:";
      origins.add(url.origin);
      origins.add(`${ws}//${url.host}`);
    } catch {
      /* ignore invalid URL */
    }
  }

  // In development, allow socket connections directly to the client's host interface if accessing via LAN
  if (isDev && rawHost) {
    try {
      const hostOnly = rawHost.split(":")[0];
      if (hostOnly && hostOnly !== "localhost" && hostOnly !== "127.0.0.1") {
        const socketPort = raw ? new URL(raw).port : "3009";
        const portStr = socketPort ? `:${socketPort}` : "";
        origins.add(`http://${hostOnly}${portStr}`);
        origins.add(`ws://${hostOnly}${portStr}`);
      }
    } catch {
      /* ignore */
    }
  }

  return Array.from(origins);
}

function parseOrigins(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCsp(nonce: string, rawHost?: string | null): string {
  const dynamicDevStorageOrigins: string[] = [];
  if (isDev) {
    dynamicDevStorageOrigins.push("http://localhost:9000", "http://127.0.0.1:9000");
    if (rawHost) {
      try {
        const hostOnly = rawHost.split(":")[0];
        if (hostOnly && hostOnly !== "localhost" && hostOnly !== "127.0.0.1") {
          dynamicDevStorageOrigins.push(`http://${hostOnly}:9000`);
        }
      } catch {
        /* ignore invalid host */
      }
    }
  }

  const extraOrigins = Array.from(
    new Set([
      ...parseOrigins(process.env.CSP_CONNECT_EXTRA),
      ...parseOrigins(process.env.CSP_STORAGE_EXTRA),
      ...parseOrigins(process.env.CSP_IMG_EXTRA),
      ...parseOrigins(process.env.CSP_FRAME_EXTRA),
      ...dynamicDevStorageOrigins,
    ]),
  );

  const unlayerDomains = [
    "https://editor.unlayer.com",
    "https://*.unlayer.com",
    "https://api.unlayer.com",
    "https://cdn.tools.unlayer.com",
  ];

  const razorpayConnectDomains = [
    "https://lumberjack.razorpay.com",
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
  ];

  const devConnect = isDev ? ["ws:", "wss:", "http:"] : [];
  const connect = [
    "'self'",
    ...devConnect,
    ...socketOrigins(rawHost),
    ...unlayerDomains,
    ...razorpayConnectDomains,
    ...extraOrigins,
  ];

  const storageMedia = [
    "'self'",
    "blob:",
    "data:",
    ...unlayerDomains,
    "https://s3.amazonaws.com",
    ...extraOrigins,
  ];

  const scriptDirectives = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://editor.unlayer.com https://*.unlayer.com https://checkout.razorpay.com`
    : `'self' https://editor.unlayer.com https://*.unlayer.com https://checkout.razorpay.com 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${scriptDirectives}`,
    // style-src permits 'unsafe-inline' specifically for Unlayer visual email builder iframe runtime
    // and dynamic tenant brand theme CSS generated client-side/SSR in tenant-theme-provider.tsx.
    // Script execution is strictly guarded via CSP nonce and strict-dynamic in production.
    "style-src 'self' 'unsafe-inline' https://editor.unlayer.com https://*.unlayer.com",
    `img-src ${storageMedia.join(" ")}`,
    "font-src 'self' data: https://editor.unlayer.com https://*.unlayer.com https://fonts.gstatic.com",
    `connect-src ${connect.join(" ")}`,
    `media-src ${storageMedia.join(" ")}`,
    `frame-src 'self' https://editor.unlayer.com https://*.unlayer.com https://api.razorpay.com https://checkout.razorpay.com ${storageMedia.join(" ")}`,
    "worker-src 'self' blob:",
    `object-src 'self' blob: ${storageMedia.join(" ")}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Strip any inbound x-tenant-* headers to prevent client spoofing. */
function stripTenantHeaders(headers: Headers): void {
  const toDelete: string[] = [];
  headers?.forEach?.((_value, key) => {
    if (key?.toLowerCase?.()?.startsWith?.("x-tenant-")) {
      toDelete.push(key);
    }
  });
  for (const key of toDelete) {
    headers?.delete?.(key);
  }
}

/** Helper to rewrite request cleanly without repeating URL cloning */
function rewriteTo(req: NextRequest, targetPath: string): NextResponse {
  const url = req?.nextUrl?.clone?.() ?? new URL(targetPath, req?.url ?? "http://localhost");
  url.pathname = targetPath;
  return NextResponse.rewrite(url);
}

/** Helper to compute and execute canonical host redirects safely */
function redirectCanonical(
  canonicalBase?: string | null,
  pathname = "/",
  search = "",
  rawHost?: string | null,
): NextResponse | null {
  if (!canonicalBase) return null;
  const currentNorm = normalizeHost(rawHost);
  if (isIpAddress(currentNorm)) return null; // Never redirect LAN IP callers to localhost canonical
  try {
    const canonicalUrl = new URL(canonicalBase);
    const targetNorm = normalizeHost(canonicalUrl?.host);
    if (currentNorm && targetNorm && currentNorm !== targetNorm) {
      const cleanBase = canonicalBase.replace(/\/+$/, "");
      const cleanPath = pathname?.startsWith?.("/") ? pathname : `/${pathname ?? ""}`;
      return NextResponse.redirect(new URL(`${cleanBase}${cleanPath}${search ?? ""}`), 307);
    }
  } catch {
    /* ignore invalid URL */
  }
  return null;
}

/**
 * Runs before every page request (not /api, not static assets).
 * Decision order follows section 5.3 of the specification.
 */
export async function proxy(req: NextRequest) {
  const pathname = req?.nextUrl?.pathname ?? "";
  const search = req?.nextUrl?.search ?? "";
  const accessCookie = req?.cookies?.get?.(ACCESS_COOKIE)?.value;
  const refreshCookie = req?.cookies?.get?.(REFRESH_COOKIE)?.value;
  const staffCookie = req?.cookies?.get?.(PLATFORM_STAFF_COOKIE)?.value;

  const hasAccess = Boolean(accessCookie && isTokenNonExpired(accessCookie));
  const hasRefresh = Boolean(refreshCookie && isTokenNonExpired(refreshCookie));
  const hasPlatformStaff = Boolean(staffCookie && isTokenNonExpired(staffCookie));
  const supportSessionId = req.cookies.get(SUPPORT_SESSION_COOKIE)?.value;
  const claims = accessCookie && supportSessionId ? decodeJwt(accessCookie) : null;
  const isSupportVisit =
    hasPlatformStaff && claims?.typ === "SUPPORT" && claims.sess === supportSessionId;

  const rawHost =
    (process.env.TRUST_PROXY === "true" ? req?.headers?.get?.("x-forwarded-host") : null) ??
    req?.headers?.get?.("host");

  const hostInfo = classifyHost(rawHost);

  // ─── 2. Host class subdomain | custom ─────────────────────────────
  if (hostInfo?.classification === "subdomain" || hostInfo?.classification === "custom") {
    // 2a. Resolve host
    const result = await resolveTenantByHost(rawHost ?? "");
    if (!result) {
      return rewriteTo(req, "/tenant-not-found");
    }

    // 2b. Suspended or Deactivated
    if (result?.status === "SUSPENDED" || result?.status === "DEACTIVATED") {
      return rewriteTo(req, "/tenant-suspended");
    }

    // 2c. Canonical-host enforcement / pathOnly fallback
    if (result?.pathOnly && result?.canonicalBase) {
      const canonicalRedirect = redirectCanonical(result.canonicalBase, pathname, search, rawHost);
      if (canonicalRedirect) return canonicalRedirect;
    }

    // 2d. Path matches /w/... on domain host -> 307 to unprefixed path
    const wMatch = pathname?.match?.(/^\/w\/[^/]+(\/.*)?$/);
    if (wMatch) {
      const rawRest = wMatch?.[1] ?? "/";
      const cleanRest = rawRest?.startsWith?.("/") ? rawRest : `/${rawRest}`;
      return NextResponse.redirect(new URL(cleanRest + search, req?.url), 307);
    }

    // 2e. Unauthenticated and protected path on domain host -> /login?next=...
    const isDomainAuthPage =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password";

    if (!isDomainAuthPage && !hasAccess) {
      const target = hasRefresh
        ? `/api/auth/refresh?next=${encodeURIComponent(pathname + search)}`
        : `/login?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(new URL(target, req?.url));
    }

    // 2f. Authenticated and path is login / register -> /dashboard
    if (isDomainAuthPage && hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req?.url));
    }

    // 2g. Rewrite to internal /w/{slug}{path}
    const nonce = btoa(crypto.randomUUID());
    const csp = buildCsp(nonce, rawHost);

    const headers = new Headers(req?.headers);
    stripTenantHeaders(headers);
    headers.set("x-tenant-slug", result?.slug ?? "");
    headers.set("x-tenant-id", result?.tenantId ?? "");
    headers.set("x-tenant-mode", result?.urlMode ?? "");
    headers.set("x-tenant-canonical", result?.canonicalBase ?? "");
    headers.set("x-nonce", nonce);
    headers.set("x-pathname", `${pathname}${search}`);
    headers.set("content-security-policy", csp);

    const restPath = pathname === "/" ? "" : pathname;
    const url =
      req?.nextUrl?.clone?.() ??
      new URL(`/w/${result?.slug ?? ""}${restPath}`, req?.url ?? "http://localhost");
    url.pathname = `/w/${result?.slug ?? ""}${restPath}`;

    const res = NextResponse.rewrite(url, { request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  // ─── 3. Host class platform ───────────────────────────────────────
  if (hostInfo?.classification === "platform") {
    if (hasPlatformStaff && supportSessionId && !hasAccess && isProtectedPath(pathname)) {
      return NextResponse.redirect(new URL(PLATFORM_ROUTES.SUPPORT_SESSIONS, req.url));
    }
    // 3a. /w/{slug}/... path routing
    const wPlatformMatch = pathname?.match?.(/^\/w\/([^/]+)(\/.*)?$/);
    if (wPlatformMatch && !pathname?.startsWith?.("/api/")) {
      const slug = wPlatformMatch?.[1];
      const rest = wPlatformMatch?.[2] ?? "/";

      if (slug) {
        const slugResult = await resolveTenantBySlug(slug);
        if (!slugResult || slugResult?.kind !== "tenant") {
          return rewriteTo(req, "/tenant-not-found");
        }

        if (slugResult?.status === "SUSPENDED" || slugResult?.status === "DEACTIVATED") {
          return rewriteTo(req, "/tenant-suspended");
        }

        if (slugResult?.isRedirect && slugResult?.slug && slugResult.slug !== slug) {
          const restClean = rest?.startsWith("/") ? rest : `/${rest}`;
          return NextResponse.redirect(
            new URL(`/w/${slugResult.slug}${restClean}${search}`, req?.url),
            307,
          );
        }

        // Effective mode !== 'path' (canonical elsewhere) -> 307 to canonical
        if (
          !isSupportVisit &&
          !isIpAddress(hostInfo?.hostname) &&
          slugResult?.canonicalBase &&
          slugResult?.urlMode &&
          slugResult.urlMode !== "path"
        ) {
          const canonicalRedirect = redirectCanonical(
            slugResult.canonicalBase,
            rest,
            search,
            rawHost,
          );
          if (canonicalRedirect) return canonicalRedirect;
        }
      }
    }

    // 3d. Platform staff console gate
    if (isPlatformPath(pathname)) {
      if (isPlatformLogin(pathname)) {
        if (hasPlatformStaff) {
          const next = req?.nextUrl?.searchParams?.get?.("next");
          const destination = safeNextPath(next, PLATFORM_ROUTES.DASHBOARD);
          return NextResponse.redirect(new URL(destination, req?.url));
        } else if (staffCookie) {
          // Stale or expired platform staff cookie detected on login page -> delete it
          const res = NextResponse.next();
          res.cookies.delete(PLATFORM_STAFF_COOKIE);
          return res;
        }
      } else {
        if (!hasPlatformStaff) {
          const res = NextResponse.redirect(
            new URL(`/platform/login?next=${encodeURIComponent(pathname + search)}`, req?.url),
          );
          if (staffCookie) {
            res.cookies.delete(PLATFORM_STAFF_COOKIE);
          }
          return res;
        }
      }
    }

    // 3e. Protected path without session
    if (isProtectedPath(pathname) && !hasAccess) {
      if (hasRefresh) {
        return NextResponse.redirect(
          new URL(`/api/auth/refresh?next=${encodeURIComponent(pathname + search)}`, req?.url),
        );
      }
      const slug = tenantSlugFromPath(pathname);
      const targetLogin = slug ? `/w/${slug}/login` : `/login`;
      return NextResponse.redirect(
        new URL(`${targetLogin}?next=${encodeURIComponent(pathname + search)}`, req?.url),
      );
    }

    // 3f. Auth page with session -> redirect
    if (isAuthPage(pathname) && hasAccess) {
      const slug = tenantSlugFromPath(pathname);
      if (slug) {
        return NextResponse.redirect(new URL(`/w/${slug}/dashboard`, req?.url));
      }
      return NextResponse.redirect(new URL("/select-workspace", req?.url));
    }
  }

  // 3g. Pass through with nonce & CSP
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, rawHost);

  const headers = new Headers(req?.headers);
  headers.set("x-nonce", nonce);
  headers.set("x-pathname", `${pathname}${search}`);
  headers.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
