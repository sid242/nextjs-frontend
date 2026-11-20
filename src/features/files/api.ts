import { api } from "@/lib/api/http";
import type {
  FileFolderRecord,
  FileRecord,
  FileShareRecord,
  FileVersionRecord,
  PresignedPost,
  StorageStats,
} from "@/lib/api/types";

export interface ListFilesParams {
  folderId?: string | null;
  search?: string;
  tag?: string;
  isDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export const listFiles = (params?: ListFilesParams, signal?: AbortSignal) => {
  const query = new URLSearchParams();
  if (params?.folderId) query.set("folderId", params.folderId);
  if (params?.search) query.set("search", params.search);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.isDeleted !== undefined) query.set("isDeleted", String(params.isDeleted));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const qs = query.toString();
  return api.get<{ items: FileRecord[]; total: number } | FileRecord[]>(
    `/files${qs ? `?${qs}` : ""}`,
    { signal },
  );
};

export const requestUpload = (
  body: {
    filename: string;
    contentType: string;
    folderId?: string | null;
    description?: string | null;
    tags?: string[];
  },
  signal?: AbortSignal,
) => api.post<{ fileId: string; upload: PresignedPost }>("/files/upload-url", body, { signal });

export const confirmUpload = (id: string, signal?: AbortSignal) =>
  api.post<FileRecord>(`/files/${id}/confirm`, undefined, { signal });

export const getDownloadUrl = (id: string, disposition?: "attachment" | "inline") =>
  api.get<{ url: string; expiresInSeconds: number }>(
    `/files/${id}/download-url${disposition ? `?disposition=${disposition}` : ""}`,
  );

export const updateFile = (
  id: string,
  body: {
    filename?: string;
    description?: string | null;
    tags?: string[];
    folderId?: string | null;
    visibility?: "PRIVATE" | "TENANT" | "PUBLIC_LINK";
  },
) => api.patch<FileRecord>(`/files/${id}`, body);

export const deleteFile = (id: string, permanent = false) =>
  api.delete(`/files/${id}${permanent ? "?permanent=true" : ""}`);

export const restoreFile = (id: string) => api.post<FileRecord>(`/files/${id}/restore`);

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export const listFolders = (parentId?: string, signal?: AbortSignal) =>
  api.get<FileFolderRecord[]>(`/files/folders${parentId ? `?parentId=${parentId}` : ""}`, {
    signal,
  });

export const createFolder = (body: {
  name: string;
  parentId?: string | null;
  color?: string | null;
}) => api.post<FileFolderRecord>("/files/folders", body);

export const updateFolder = (
  id: string,
  body: { name?: string; color?: string | null; parentId?: string | null },
) => api.patch<FileFolderRecord>(`/files/folders/${id}`, body);

export const deleteFolder = (id: string) => api.delete(`/files/folders/${id}`);

// ---------------------------------------------------------------------------
// Shares
// ---------------------------------------------------------------------------

export const createShare = (
  fileId: string,
  body: { password?: string; maxDownloads?: number; expiresInHours?: number },
) =>
  api.post<{
    shareId: string;
    token: string;
    expiresAt: string | null;
    maxDownloads: number | null;
  }>(`/files/${fileId}/shares`, body);

export const listShares = (fileId: string) => api.get<FileShareRecord[]>(`/files/${fileId}/shares`);

export const revokeShare = (fileId: string, shareId: string) =>
  api.delete(`/files/${fileId}/shares/${shareId}`);

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export const listVersions = (fileId: string) =>
  api.get<FileVersionRecord[]>(`/files/${fileId}/versions`);

export const restoreVersion = (fileId: string, versionNumber: number) =>
  api.post<FileRecord>(`/files/${fileId}/versions/restore`, { versionNumber });

// ---------------------------------------------------------------------------
// Storage Stats
// ---------------------------------------------------------------------------

export const getStorageStats = () => api.get<StorageStats>("/files/stats");
