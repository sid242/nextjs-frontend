import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_GUARD_COOKIE,
} from "./constants";
import { decodeJwt } from "./jwt";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const now = () => Math.floor(Date.now() / 1000);

function baseOptions() {
  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  return { httpOnly: true, secure, sameSite: "lax" as const };
}

/**
 * Tokens live in httpOnly cookies: page JavaScript (and therefore XSS) can never read them.
 * The access cookie expires slightly BEFORE the JWT so the next request notices and refreshes in time.
 */
export function applyAuthCookies<T extends NextResponse>(res: T, tokens: Tokens): T {
  const accessExp = decodeJwt(tokens.accessToken)?.exp;
  const refreshExp = decodeJwt(tokens.refreshToken)?.exp;

  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    path: "/",
    maxAge: accessExp ? Math.max(accessExp - now() - 10, 1) : 600,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: refreshExp ? Math.max(refreshExp - now(), 1) : 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAuthCookies<T extends NextResponse>(res: T): T {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseOptions(), path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...baseOptions(), path: REFRESH_COOKIE_PATH, maxAge: 0 });
  res.cookies.set(REFRESH_GUARD_COOKIE, "", {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
  return res;
}

/** Marks "we just refreshed" for a few seconds (see refresh route). */
export function setRefreshGuard<T extends NextResponse>(res: T): T {
  res.cookies.set(REFRESH_GUARD_COOKIE, "1", {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: 10,
  });
  return res;
}
