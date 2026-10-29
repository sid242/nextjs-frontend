/**
 * Only allow same-site relative paths as post-login redirect targets.
 * Blocks open redirects such as //evil.com, /\evil.com or https://evil.com.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  if (next.startsWith("/api/")) return fallback; // never bounce back into the BFF
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
export const AUTH_PAGES = ["/login", "/register"] as const;

export const RESERVED_ROOT_SEGMENTS = new Set([
  "api",
  "platform",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "accept-invitation",
  "verify-email",
  "dashboard",
  "files",
  "settings",
  "email-templates",
  "team",
  "audit-logs",
  "branding",
  "notifications",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function matchTenantAuthPath(
  pathname: string,
): { tenantSlug: string; action: "login" | "register" } | null {
  const match = pathname.match(/^\/([a-zA-Z0-9_-]+)\/(login|register)$/);
  if (!match) return null;
  const [, slug, action] = match;
  if (!slug || RESERVED_ROOT_SEGMENTS.has(slug.toLowerCase())) return null;
  return { tenantSlug: slug, action: action as "login" | "register" };
}

export const PLATFORM_PREFIX = "/platform";
export const PLATFORM_LOGIN_PATH = "/platform/login";

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const isAuthPage = (pathname: string) =>
  (AUTH_PAGES as readonly string[]).includes(pathname) || matchTenantAuthPath(pathname) !== null;

export const isPlatformPath = (pathname: string) =>
  pathname === PLATFORM_PREFIX || pathname.startsWith(`${PLATFORM_PREFIX}/`);

export const isPlatformLogin = (pathname: string) => pathname === PLATFORM_LOGIN_PATH;
