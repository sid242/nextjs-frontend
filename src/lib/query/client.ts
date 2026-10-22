import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, getErrorMessage, isCanceledError } from "@/lib/api/errors";
import { reportError } from "@/lib/monitoring";

import { shouldRetry } from "./retry";

/**
 * Per-query / per-mutation opt-outs, typed:
 *   useMutation({ ..., meta: { silent: true } })              -> you show the error yourself (inline form alert)
 *   useMutation({ ..., meta: { errorMessage: "Could not save" } }) -> custom toast text
 */
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { silent?: boolean; errorMessage?: string };
    mutationMeta: { silent?: boolean; errorMessage?: string };
  }
}

/** 4xx are expected outcomes (validation, not found); anything else is worth reporting. */
const isUnexpected = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 0 || error.status >= 500;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isServer || isCanceledError(error)) return;
        if (isUnexpected(error)) reportError(error, { queryKey: query.queryKey });
        // Initial-load failures render their own error UI; only tell the user about FAILED BACKGROUND refetches
        // (they still see stale data, so they'd otherwise never know it's out of date).
        if (query.state.data !== undefined && !query.meta?.silent) {
          toast.error(query.meta?.errorMessage ?? getErrorMessage(error), { id: query.queryHash });
        }
      },
    }),
    mutationCache: new MutationCache({
      // Every failed mutation gets a toast by default so errors are never silently swallowed.
      onError: (error, _variables, _context, mutation) => {
        if (isServer || isCanceledError(error)) return;
        if (isUnexpected(error)) reportError(error, { mutationKey: mutation.options.mutationKey });
        if (!mutation.meta?.silent)
          toast.error(mutation.meta?.errorMessage ?? getErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000, // also stops a refetch right after server-side hydration
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: { retry: false }, // mutations are not idempotent by default: never auto-retry them
    },
  });
}

// TypeScript declaration for TanStack Query Devtools browser extension
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__?: import("@tanstack/query-core").QueryClient;
  }
}

let browserClient: QueryClient | undefined;

/**
 * One client per browser tab (survives Suspense re-mounts), a fresh one per request on the server so
 * data can never leak between users. Call `queryClient.clear()` on sign-in/out.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  if (!browserClient) {
    browserClient = makeQueryClient();
    if (typeof window !== "undefined") {
      window.__TANSTACK_QUERY_CLIENT__ = browserClient;
    }
  }
  return browserClient;
}
