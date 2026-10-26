import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import {
  isAuthPage,
  isPlatformLogin,
  isPlatformPath,
  isProtectedPath,
  matchTenantAuthPath,
} from "@/lib/auth/paths";

const isDev = process.env.NODE_ENV !== "production";

/** CSP connect-src needs the Socket.IO origin in both http(s) and ws(s) flavours. */
function socketOrigins(): string[] {
  const raw = process.env.SOCKET_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return [url.origin, `${ws}//${url.host}`];
  } catch {
    return [];
  }
}

function parseOrigins(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCsp(nonce: string): string {
  const extraOrigins = Array.from(
    new Set([
      ...parseOrigins(process.env.CSP_CONNECT_EXTRA),
      ...parseOrigins(process.env.CSP_STORAGE_EXTRA),
      ...parseOrigins(process.env.CSP_IMG_EXTRA),
      ...parseOrigins(process.env.CSP_FRAME_EXTRA),
    ]),
  );

  const unlayerDomains = [
    "https://editor.unlayer.com",
    "https://*.unlayer.com",
    "https://api.unlayer.com",
    "https://cdn.tools.unlayer.com",
  ];

  const connect = ["'self'", ...socketOrigins(), ...unlayerDomains, ...extraOrigins];

  const storageMedia = [
    "'self'",
    "blob:",
    "data:",
    ...unlayerDomains,
    "https://s3.amazonaws.com",
    ...extraOrigins,
  ];

  return [
    "default-src 'self'",
    `script-src 'self' https://editor.unlayer.com https://*.unlayer.com 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://editor.unlayer.com https://*.unlayer.com",
    `img-src ${storageMedia.join(" ")}`,
    "font-src 'self' data: https://editor.unlayer.com https://*.unlayer.com https://fonts.gstatic.com",
    `connect-src ${connect.join(" ")}`,
    `media-src ${storageMedia.join(" ")}`,
    `frame-src 'self' https://editor.unlayer.com https://*.unlayer.com ${extraOrigins.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Runs before every page request (not /api, not static assets):
 *  1. route guard: anonymous -> /login, signed-in -> away from /login & /register, stale access -> refresh
 *  2. platform operator gate: non-staff -> /platform/login, authenticated staff on login -> /platform/staff
 *  3. per-request CSP nonce
 *  4. exposes the pathname to server components (used by requireUser to build the refresh redirect)
 * This is a UX gate only. Real authorization happens in the backend on every API call.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasAccess = req.cookies.has(ACCESS_COOKIE);
  const hasRefresh = req.cookies.has(REFRESH_COOKIE);
  const hasPlatformStaff = req.cookies.has(PLATFORM_STAFF_COOKIE);

  // Platform console gate
  if (isPlatformPath(pathname)) {
    if (isPlatformLogin(pathname)) {
      if (hasPlatformStaff) {
        return NextResponse.redirect(new URL("/platform/staff", req.url));
      }
    } else {
      if (!hasPlatformStaff) {
        return NextResponse.redirect(
          new URL(`/platform/login?next=${encodeURIComponent(pathname + search)}`, req.url),
        );
      }
    }
  }

  // Clean path slug auth: e.g. /acme-realty/login or /acme-realty/register
  const tenantAuth = matchTenantAuthPath(pathname);
  if (tenantAuth) {
    if (hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    const url = req.nextUrl.clone();
    url.pathname = `/${tenantAuth.action}`;
    url.searchParams.set("tenant", tenantAuth.tenantSlug);

    const nonce = btoa(crypto.randomUUID());
    const csp = buildCsp(nonce);

    const headers = new Headers(req.headers);
    headers.set("x-nonce", nonce);
    headers.set("x-pathname", `${pathname}${search}`);
    headers.set("content-security-policy", csp);

    const res = NextResponse.rewrite(url, { request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  if (isProtectedPath(pathname) && !hasAccess) {
    const target = hasRefresh
      ? `/api/auth/refresh?next=${encodeURIComponent(pathname + search)}`
      : `/login?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (isAuthPage(pathname) && hasAccess) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("x-pathname", pathname + search);
  headers.set("content-security-policy", csp); // Next reads the nonce from the request's CSP to tag its own scripts

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
