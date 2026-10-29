import * as Sentry from "@sentry/nextjs";

/**
 * Single choke point for error reporting. Wire your tracker in here once (Sentry, Datadog, ...) and every
 * caller (error boundaries, the query client) reports through it.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", error, context ?? "");
  }

  try {
    Sentry.withScope((scope) => {
      if (context) {
        for (const [key, val] of Object.entries(context)) {
          scope.setExtra(key, val);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // Fail-safe: monitoring reporting must never throw and crash the application
  }
}
