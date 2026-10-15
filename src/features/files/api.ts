import { api } from "@/lib/api/http";
import type { FileRecord, PresignedPost } from "@/lib/api/types";

// Layer 1 of 3 for a feature: plain typed calls, no React. (2: queries.ts hooks, 3: components.)
// Every call accepts an AbortSignal so TanStack Query / the upload queue can cancel it.

export const listFiles = (signal?: AbortSignal) => api.get<FileRecord[]>("/files", { signal });

export const requestUpload = (
  body: { filename: string; contentType: string },
  signal?: AbortSignal,
) => api.post<{ fileId: string; upload: PresignedPost }>("/files/upload-url", body, { signal });

export const confirmUpload = (id: string, signal?: AbortSignal) =>
  api.post<FileRecord>(`/files/${id}/confirm`, undefined, { signal });

export const getDownloadUrl = (id: string) =>
  api.get<{ url: string; expiresInSeconds: number }>(`/files/${id}/download-url`);

export const deleteFile = (id: string) => api.delete(`/files/${id}`);
