"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  FileFolderRecord,
  FileRecord,
  FileShareRecord,
  FileVersionRecord,
  StorageStats,
} from "@/lib/api/types";

import {
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
  list: (params?: ListFilesParams) =>
    queryOptions({
      queryKey: filesKeys.list(params),
      queryFn: async ({ signal }) => {
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

  folders: (parentId?: string) =>
    queryOptions({
      queryKey: filesKeys.folders(parentId),
      queryFn: async ({ signal }) => {
        const res = await listFolders(parentId, signal);
        return Array.isArray(res) ? res : [];
      },
    }),

  stats: () =>
    queryOptions({
      queryKey: filesKeys.stats(),
      queryFn: async () => {
        const res = await getStorageStats();
        return res as StorageStats;
      },
    }),

  shares: (fileId: string) =>
    queryOptions({
      queryKey: filesKeys.shares(fileId),
      queryFn: async () => {
        if (!fileId) return [];
        const res = await listShares(fileId);
        return Array.isArray(res) ? res : [];
      },
      enabled: Boolean(fileId),
    }),

  versions: (fileId: string) =>
    queryOptions({
      queryKey: filesKeys.versions(fileId),
      queryFn: async () => {
        if (!fileId) return [];
        const res = await listVersions(fileId);
        return Array.isArray(res) ? res : [];
      },
      enabled: Boolean(fileId),
    }),
};

export const useFiles = (params?: ListFilesParams) => useQuery(filesQueryOptions.list(params));
export const useFolders = (parentId?: string) => useQuery(filesQueryOptions.folders(parentId));
export const useStorageStats = () => useQuery(filesQueryOptions.stats());
export const useFileShares = (fileId: string) => useQuery(filesQueryOptions.shares(fileId));
export const useFileVersions = (fileId: string) => useQuery(filesQueryOptions.versions(fileId));

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg: string | { id: string; permanent?: boolean }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const permanent = typeof arg === "string" ? false : (arg.permanent ?? false);
      return deleteFile(id, permanent);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreFile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
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
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; parentId?: string | null; color?: string | null }) =>
      createFolder(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
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
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useCreateFileShare() {
  const queryClient = useQueryClient();
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
      void queryClient.invalidateQueries({ queryKey: filesKeys.shares(fileId) });
    },
  });
}

export function useRevokeFileShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, shareId }: { fileId: string; shareId: string }) =>
      revokeShare(fileId, shareId),
    onSuccess: (_, { fileId }) => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.shares(fileId) });
    },
  });
}

export function useRestoreFileVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, versionNumber }: { fileId: string; versionNumber: number }) =>
      restoreVersion(fileId, versionNumber),
    onSuccess: (_, { fileId }) => {
      void queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}
