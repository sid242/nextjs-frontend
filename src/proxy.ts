import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { isAuthPage, isProtectedPath } from "@/lib/auth/paths";

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
    ]),
  );

  const connect = ["'self'", ...socketOrigins(), ...extraOrigins];

  const storageMedia = ["'self'", "blob:", "data:", ...extraOrigins];

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${storageMedia.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    `media-src ${storageMedia.join(" ")}`,
    `frame-src 'self' ${extraOrigins.join(" ")}`,
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
 *  2. per-request CSP nonce
 *  3. exposes the pathname to server components (used by requireUser to build the refresh redirect)
 * This is a UX gate only. Real authorization happens in the backend on every API call.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasAccess = req.cookies.has(ACCESS_COOKIE);
  const hasRefresh = req.cookies.has(REFRESH_COOKIE);

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
