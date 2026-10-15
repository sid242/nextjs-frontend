import "server-only";
import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";

/**
 * Per-request QueryClient for server components: prefetch here, hand the result to the browser with
 * <HydrationBoundary state={dehydrate(queryClient)}>, and the client's useQuery finds the data already cached
 * (no loading spinner, no duplicate request). `cache()` scopes it to one request, so nothing is shared between users.
 */
export const getServerQueryClient = cache(
  () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }),
);
