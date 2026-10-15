import "server-only";
import type { NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import type { Tokens } from "@/lib/auth/cookies";
import { backendFetch } from "./backend";
import { forwardedHeaders } from "./request";

export type RefreshResult =
  { ok: true; tokens: Tokens } | { ok: false; reason: "invalid" | "unavailable" };

/**
 * Exchange the refresh cookie for new tokens.
 * "invalid"     => the session is really over (clear cookies, go to login)
 * "unavailable" => backend hiccup (keep cookies so a transient outage doesn't log everyone out)
 */
export async function refreshTokens(req: NextRequest): Promise<RefreshResult> {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return { ok: false, reason: "invalid" };

  let res: Response;
  try {
    res = await backendFetch("/auth/refresh", {
      method: "POST",
      json: { refreshToken },
      headers: forwardedHeaders(req),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as Partial<Tokens> | null;
    if (data?.accessToken && data.refreshToken) {
      return {
        ok: true,
        tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken },
      };
    }
    return { ok: false, reason: "unavailable" };
  }
  return { ok: false, reason: res.status >= 500 || res.status === 429 ? "unavailable" : "invalid" };
}
