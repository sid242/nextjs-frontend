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
export const PROTECTED_PREFIXES = ["/dashboard", "/files", "/settings"] as const;
export const AUTH_PAGES = ["/login", "/register"] as const;

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const isAuthPage = (pathname: string) =>
  (AUTH_PAGES as readonly string[]).includes(pathname);
