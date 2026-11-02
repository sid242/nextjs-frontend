import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import {
  isAuthPage,
  isPlatformLogin,
  isPlatformPath,
  isProtectedPath,
  matchTenantAuthPath,
  safeNextPath,
  tenantSlugFromPath,
} from "@/lib/auth/paths";
import { classifyHost, normalizeHost } from "@/lib/tenancy/host";
import { resolveTenantByHost, resolveTenantBySlug } from "@/lib/tenancy/resolve";

const isDev = process.env.NODE_ENV !== "production";

/** CSP connect-src needs the Socket.IO origin in both http(s) and ws(s) flavours. */
function socketOrigins(): string[] {
  const raw = process.env.SOCKET_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
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
  try {
    const canonicalUrl = new URL(canonicalBase);
    const currentNorm = normalizeHost(rawHost);
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
  const hasAccess = req?.cookies?.has?.(ACCESS_COOKIE);
  const hasRefresh = req?.cookies?.has?.(REFRESH_COOKIE);
  const hasPlatformStaff = req?.cookies?.has?.(PLATFORM_STAFF_COOKIE);
  const ctxSlug = req?.cookies?.get?.("ctx_slug")?.value;

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
    const csp = buildCsp(nonce);

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

        // Effective mode !== 'path' (canonical elsewhere) -> 307 to canonical
        if (slugResult?.canonicalBase && slugResult?.urlMode && slugResult.urlMode !== "path") {
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

    // 3b. Legacy unscoped tenant paths on platform host -> redirect
    const isLegacyTenantPath =
      /^\/(dashboard|team|roles|files|settings|audit-logs|email-templates|branding)(\/.*)?$/.test(
        pathname,
      );
    if (isLegacyTenantPath) {
      if (ctxSlug) {
        return NextResponse.redirect(new URL(`/w/${ctxSlug}${pathname}${search}`, req?.url), 307);
      }
      return NextResponse.redirect(new URL("/select-workspace", req?.url), 307);
    }

    // 3c. Legacy /{slug}/login|register -> redirect to /w/{slug}/...
    const legacyAuth = matchTenantAuthPath(pathname);
    if (legacyAuth) {
      return NextResponse.redirect(
        new URL(`/w/${legacyAuth.tenantSlug}/${legacyAuth.action}${search}`, req?.url),
        307,
      );
    }

    // 3d. Platform staff console gate
    if (isPlatformPath(pathname)) {
      if (isPlatformLogin(pathname)) {
        if (hasPlatformStaff) {
          const next = req?.nextUrl?.searchParams?.get?.("next");
          const destination = safeNextPath(next, "/platform/dashboard");
          return NextResponse.redirect(new URL(destination, req?.url));
        }
      } else {
        if (!hasPlatformStaff) {
          return NextResponse.redirect(
            new URL(`/platform/login?next=${encodeURIComponent(pathname + search)}`, req?.url),
          );
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
      if (ctxSlug) {
        return NextResponse.redirect(new URL(`/w/${ctxSlug}/dashboard`, req?.url));
      }
      return NextResponse.redirect(new URL("/select-workspace", req?.url));
    }
  }

  // 3g. Pass through with nonce & CSP
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

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
