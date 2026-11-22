"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { FileRecord, StorageStats } from "@/lib/api/types";
import { useTenantUrl } from "@/lib/tenancy";

import {
  confirmUpload,
  createFolder,
  createShare,
  deleteFile,
  deleteFolder,
  getStorageStats,
  listFiles,
  listFolders,
  listShares,
  listVersions,
  restoreFile,
  restoreVersion,
  revokeShare,
  updateFile,
  updateFolder,
  type ListFilesParams,
} from "./api";
import { filesKeys } from "./keys";

export const filesQueryOptions = {
  list: (slug: string, params?: ListFilesParams) =>
    queryOptions<{ items: FileRecord[]; total: number }>({
      queryKey: filesKeys.list(slug, params),
      enabled: Boolean(slug),
      refetchInterval: (query) =>
        query.state.data?.items?.some(
          (file) => file?.status === "UPLOADED" && file?.scanStatus === "PENDING",
        )
          ? 5_000
          : false,
      queryFn: async ({ signal }): Promise<{ items: FileRecord[]; total: number }> => {
        const res = await listFiles(params, signal);
        if (Array.isArray(res)) return { items: res, total: res.length };
        if (res && typeof res === "object" && "items" in res && Array.isArray(res.items)) {
          return res;
        }
        if (
          res &&
          typeof res === "object" &&
          "data" in res &&
          Array.isArray((res as { data?: FileRecord[] }).data)
        ) {
          const arr = (res as { data: FileRecord[] }).data;
          return { items: arr, total: arr.length };
        }
        return { items: [] as FileRecord[], total: 0 };
      },
    }),

  folders: (slug: string, parentId?: string) =>
    queryOptions({
      queryKey: filesKeys.folders(slug, parentId),
      enabled: Boolean(slug),
      queryFn: async ({ signal }) => {
        const res = await listFolders(parentId, signal);
        return Array.isArray(res) ? res : [];
      },
    }),

  stats: (slug: string) =>
    queryOptions({
      queryKey: filesKeys.stats(slug),
      enabled: Boolean(slug),
      queryFn: async () => {
        const res = await getStorageStats();
        return res as StorageStats;
      },
    }),

  shares: (slug: string, fileId: string) =>
    queryOptions({
      queryKey: filesKeys.shares(slug, fileId),
      queryFn: async () => {
        if (!fileId) return [];
        const res = await listShares(fileId);
        return Array.isArray(res) ? res : [];
      },
      enabled: Boolean(slug && fileId),
    }),

  versions: (slug: string, fileId: string) =>
    queryOptions({
      queryKey: filesKeys.versions(slug, fileId),
      queryFn: async () => {
        if (!fileId) return [];
        const res = await listVersions(fileId);
        return Array.isArray(res) ? res : [];
      },
      enabled: Boolean(slug && fileId),
    }),
};

export const useFiles = (params?: ListFilesParams) =>
  useQuery(filesQueryOptions.list(useTenantUrl()?.slug ?? "", params));
export const useFolders = (parentId?: string) =>
  useQuery(filesQueryOptions.folders(useTenantUrl()?.slug ?? "", parentId));
export const useStorageStats = () => useQuery(filesQueryOptions.stats(useTenantUrl()?.slug ?? ""));
export const useFileShares = (fileId: string) =>
  useQuery(filesQueryOptions.shares(useTenantUrl()?.slug ?? "", fileId));
export const useFileVersions = (fileId: string) =>
  useQuery(filesQueryOptions.versions(useTenantUrl()?.slug ?? "", fileId));

export function useRetryFileScan() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (fileId: string) => confirmUpload(fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (arg: string | { id: string; permanent?: boolean }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const permanent = typeof arg === "string" ? false : (arg.permanent ?? false);
      return deleteFile(id, permanent);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (id: string) => restoreFile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      filename?: string;
      description?: string | null;
      tags?: string[];
      folderId?: string | null;
      visibility?: "PRIVATE" | "TENANT" | "PUBLIC_LINK";
    }) => updateFile(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (body: { name: string; parentId?: string | null; color?: string | null }) =>
      createFolder(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      color?: string | null;
      parentId?: string | null;
    }) => updateFolder(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}

export function useCreateFileShare() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({
      fileId,
      ...body
    }: {
      fileId: string;
      password?: string;
      maxDownloads?: number;
      expiresInHours?: number;
    }) => createShare(fileId, body),
    onSuccess: (_, { fileId }) => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.shares(slug, fileId) });
    },
  });
}

export function useRevokeFileShare() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({ fileId, shareId }: { fileId: string; shareId: string }) =>
      revokeShare(fileId, shareId),
    onSuccess: (_, { fileId }) => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.shares(slug, fileId) });
    },
  });
}

export function useRestoreFileVersion() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({ fileId, versionNumber }: { fileId: string; versionNumber: number }) =>
      restoreVersion(fileId, versionNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.workspace(slug) });
    },
  });
}
