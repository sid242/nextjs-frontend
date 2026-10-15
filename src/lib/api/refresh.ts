import axios from "axios";

export type RefreshOutcome = "ok" | "expired" | "unavailable";

let inflight: Promise<RefreshOutcome> | null = null;

/**
 * Exchange the httpOnly refresh cookie for new tokens (the BFF sets the new cookies).
 *
 * Single-flight: refresh tokens are single-use, so N parallel 401s must share ONE refresh,
 * otherwise the second call would present an already-consumed token and log the user out.
 *
 * "expired"     -> the session is really over (401): send the user to /login
 * "unavailable" -> network/5xx hiccup: do NOT log the user out, just surface the original error
 *
 * Uses bare axios (no interceptors) so a failing refresh can never recurse into itself.
 */
export function refreshSession(): Promise<RefreshOutcome> {
  inflight ??= axios
    .post("/api/auth/refresh", undefined, { withCredentials: true, timeout: 10_000 })
    .then((): RefreshOutcome => "ok")
    .catch((err: unknown): RefreshOutcome =>
      axios.isAxiosError(err) && err.response?.status === 401 ? "expired" : "unavailable",
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
