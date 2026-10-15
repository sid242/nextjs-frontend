// Contract with the backend. Hand-written for now; generate from OpenAPI once the backend publishes it.
export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export type FileStatus = "PENDING" | "UPLOADED";

export interface FileRecord {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  size: number | null;
  status: FileStatus;
  ownerId: string;
  createdAt: string;
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
