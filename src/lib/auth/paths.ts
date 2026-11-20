import { PLATFORM_ROUTES } from "@/config/routes";

/**
 * Only allow same-site relative paths as post-login redirect targets.
 * Blocks open redirects such as //evil.com, /\evil.com or https://evil.com.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  if (next.startsWith("/api/")) return fallback; // never bounce back into the BFF
  if (/^\/w\/[^/]+$/.test(next)) return `${next}/dashboard`;
  return next;
}

/** Routes that need a signed-in user. Keep in sync with the (app) route group. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/files",
  "/settings",
  "/team",
  "/roles",
  "/email-templates",
  "/branding",
  "/audit-logs",
  "/w",
] as const;
export const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/accept-invite"] as const;

export function isTenantAuthPath(pathname: string): boolean {
  return /^\/w\/[^/]+\/(login|register|forgot-password|reset-password|accept-invite)$/.test(
    pathname,
  );
}

export function tenantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/w\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const RESERVED_ROOT_SEGMENTS = new Set([
  "api",
  "platform",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "accept-invitation",
  "verify-email",
  "select-workspace",
  "w",
  "dashboard",
  "files",
  "settings",
  "email-templates",
  "team",
  "audit-logs",
  "branding",
  "groups",
  "notifications",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export const PLATFORM_PREFIX = PLATFORM_ROUTES.ROOT;
export const PLATFORM_LOGIN_PATH = PLATFORM_ROUTES.LOGIN;

export const isProtectedPath = (pathname: string): boolean => {
  if (isTenantAuthPath(pathname)) return false;
  if (pathname === "/select-workspace" || pathname.startsWith("/select-workspace/")) return true;
  if (pathname.startsWith("/onboarding/")) return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

export const isAuthPage = (pathname: string): boolean =>
  (AUTH_PAGES as readonly string[]).includes(pathname) || isTenantAuthPath(pathname);

export const isPlatformPath = (pathname: string) =>
  pathname === PLATFORM_PREFIX || pathname.startsWith(`${PLATFORM_PREFIX}/`);

export const isPlatformLogin = (pathname: string) => pathname === PLATFORM_LOGIN_PATH;
