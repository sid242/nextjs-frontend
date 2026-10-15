import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when no response was received (offline, DNS, CORS, timeout). */
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    /** Correlates with backend logs (x-request-id). Safe to show to users as a support reference. */
    public readonly requestId?: string,
    /** Seconds to wait before retrying (from the Retry-After header on 429/503). */
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Dict = Record<string, unknown>;
const isDict = (value: unknown): value is Dict => typeof value === "object" && value !== null;

/** Cancellations (AbortController, TanStack Query cancelling a stale request) are not failures. */
export function isCanceledError(err: unknown): boolean {
  return (
    isDict(err) &&
    (err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError")
  );
}

export function isApiError(err: unknown, status?: number): err is ApiError {
  return err instanceof ApiError && (status === undefined || err.status === status);
}

function header(headers: unknown, name: string): string | undefined {
  if (!isDict(headers)) return undefined;
  const value = headers[name]; // axios lower-cases response header names
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

/**
 * Normalise whatever axios throws into an ApiError. Duck-typed on purpose (no axios import) so this module
 * stays dependency-free. Cancellations and unknown errors pass through untouched.
 */
export function toApiError(err: unknown): unknown {
  if (err instanceof ApiError || isCanceledError(err)) return err;
  if (!isDict(err) || err.isAxiosError !== true) return err;

  const response = err.response;
  if (!isDict(response)) {
    const timedOut = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
    return timedOut
      ? new ApiError(0, "TIMEOUT", "The request timed out. Please try again.")
      : new ApiError(
          0,
          "NETWORK_ERROR",
          "Can't reach the server. Check your connection and try again.",
        );
  }

  const status = typeof response.status === "number" ? response.status : 0;
  const statusText = typeof response.statusText === "string" ? response.statusText : "";
  const body = (isDict(response.data) ? response.data : {}) as ApiErrorBody;
  const retryAfter = Number(header(response.headers, "retry-after"));

  return new ApiError(
    status,
    body.error?.code ?? "HTTP_ERROR",
    body.error?.message ?? (statusText || "Request failed"),
    body.error?.details,
    body.requestId ?? header(response.headers, "x-request-id"),
    Number.isFinite(retryAfter) ? retryAfter : undefined,
  );
}

/** A message that is safe to show: never leaks server internals for 5xx. */
export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return err.retryAfter
        ? `Too many requests. Please try again in ${err.retryAfter}s.`
        : "Too many attempts. Please wait a moment and try again.";
    }
    if (err.status === 0) return err.message;
    if (err.status >= 500)
      return err.requestId ? `${fallback} (ref ${err.requestId.slice(0, 8)})` : fallback;
    return err.message;
  }
  return err instanceof Error ? err.message : fallback;
}
