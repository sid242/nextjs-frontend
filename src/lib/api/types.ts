export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  locale?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
}

export type FileStatus = "PENDING" | "UPLOADED";
export type FileScanStatus = "PENDING" | "CLEAN" | "INFECTED" | "SKIPPED";
export type FileVisibility = "PRIVATE" | "TENANT" | "PUBLIC_LINK";

export interface FileFolderRecord {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileShareRecord {
  id: string;
  fileId: string;
  tokenHash: string;
  maxDownloads?: number | null;
  downloadCount: number;
  expiresAt?: string | null;
  createdAt: string;
}

export interface FileVersionRecord {
  id: string;
  fileId: string;
  versionNumber: number;
  size: number | null;
  checksumSha256?: string | null;
  createdAt: string;
}

export interface StorageCategoryBreakdown {
  category: string;
  bytes: number;
  count: number;
}

export interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  deletedFiles: number;
  categoryBreakdown: StorageCategoryBreakdown[];
}

export interface FileRecord {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  size: number | null;
  status: FileStatus;
  ownerId: string;
  folderId?: string | null;
  scanStatus?: FileScanStatus;
  visibility?: FileVisibility;
  description?: string | null;
  tags?: string[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  version?: number;
  downloadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  requestId?: string;
}

/** Shape of paginated list endpoints (e.g. GET /users). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
