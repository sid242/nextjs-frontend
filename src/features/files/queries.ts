"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { FileRecord } from "@/lib/api/types";

import { deleteFile, listFiles } from "./api";
import { filesKeys } from "./keys";

// Layer 2 of 3: TanStack Query hooks. queryOptions() keeps key + fetcher together and is reusable
// for useQuery, prefetchQuery and setQueryData with full type inference.
export const filesQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: filesKeys.list(),
      queryFn: async ({ signal }) => {
        const res = await listFiles(signal);
        if (Array.isArray(res)) return res;
        if (
          res &&
          typeof res === "object" &&
          Array.isArray((res as { data?: FileRecord[] }).data)
        ) {
          return (res as { data: FileRecord[] }).data;
        }
        return [];
      },
    }),
};

export const useFiles = () => useQuery(filesQueryOptions.list());

/** Optimistic delete: the row disappears instantly and is restored if the server rejects it. */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const key = filesKeys.list();

  return useMutation({
    mutationFn: deleteFile,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: key }); // don't let an in-flight refetch overwrite our update
      const previous = queryClient.getQueryData<FileRecord[]>(key);
      queryClient.setQueryData<FileRecord[]>(key, (old) => old?.filter((file) => file.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: filesKeys.all }),
  });
}
