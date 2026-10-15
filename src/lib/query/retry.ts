import { ApiError, isCanceledError } from "@/lib/api/errors";

export const MAX_RETRIES = 2;

/**
 * Retry transient failures (network, timeouts, 5xx, 429) but never client errors:
 * retrying a 400/401/403/404 can't succeed and only delays the error UI.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isCanceledError(error)) return false;
  if (error instanceof ApiError) {
    const clientError = error.status >= 400 && error.status < 500;
    if (clientError && error.status !== 408 && error.status !== 429) return false;
  }
  return failureCount < MAX_RETRIES;
}
