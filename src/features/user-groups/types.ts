export type GroupScope = "PLATFORM" | "TENANT";
export type GroupStatus = "ACTIVE" | "ARCHIVED";

export interface UserGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: GroupScope;
  tenantId: string | null;
  status: GroupStatus;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface TenantGroupMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  joinedGroupAt: string;
}

export interface PlatformGroupMember {
  id: string;
  staffId: string;
  displayName: string;
  email: string;
  status: string;
  roleId: string;
  joinedGroupAt: string;
}

export interface GroupFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "ARCHIVED" | "ALL";
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
