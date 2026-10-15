import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth/session";
import type { FileRecord } from "@/lib/api/types";
import { backendFetch } from "@/lib/server/backend";
import { filesKeys } from "./keys";

/**
 * Server-side prefetch for the files list. Errors are swallowed by prefetchQuery on purpose: if this fails
 * (expired token, backend blip) the browser simply fetches on mount and its axios layer handles refresh/retry.
 * Must use the SAME query key as the client's useFiles().
 */
export async function prefetchFiles(queryClient: QueryClient): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: filesKeys.list(),
    queryFn: async () => {
      const res = await backendFetch("/files", { token });
      if (!res.ok) throw new Error(`Prefetch /files failed (${res.status})`);
      return (await res.json()) as FileRecord[];
    },
  });
}
