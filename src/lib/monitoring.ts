/**
 * Single choke point for error reporting. Wire your tracker in here once (Sentry, Datadog, ...) and every
 * caller (error boundaries, the query client) reports through it.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[error]", error, context ?? "");
  // Sentry.captureException(error, { extra: context });
}
