import { api } from "@/lib/api/http";

import type { CreateGroupValues, UpdateGroupValues } from "./schemas";
import type {
  GroupFilters,
  PaginatedResult,
  PlatformGroupMember,
  TenantGroupMember,
  UserGroup,
} from "./types";

function buildQuery(filters?: GroupFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function normalizePaginatedResult<T>(raw: unknown, defaultLimit = 20): PaginatedResult<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      total: raw.length,
      page: 1,
      limit: raw.length || defaultLimit,
    };
  }
  const obj = raw as Partial<PaginatedResult<T>> | undefined;
  const items = Array.isArray(obj?.items) ? obj.items : [];
  return {
    items,
    total: typeof obj?.total === "number" ? obj.total : items.length,
    page: obj?.page ?? 1,
    limit: obj?.limit ?? defaultLimit,
  };
}

// ============================================================================
// TENANT API FUNCTIONS
// ============================================================================

export async function getTenantGroups(
  filters?: GroupFilters,
  signal?: AbortSignal,
): Promise<PaginatedResult<UserGroup>> {
  const data = await api.get<unknown>(`/groups${buildQuery(filters)}`, { signal });
  return normalizePaginatedResult<UserGroup>(data, filters?.limit);
}

export async function getTenantGroup(groupId: string, signal?: AbortSignal): Promise<UserGroup> {
  return api.get<UserGroup>(`/groups/${groupId}`, { signal });
}

export async function createTenantGroup(input: CreateGroupValues): Promise<UserGroup> {
  const payload = {
    name: input.name,
    slug: input.slug && input.slug.length > 0 ? input.slug : undefined,
    description: input.description && input.description.length > 0 ? input.description : undefined,
  };
  return api.post<UserGroup>("/groups", payload);
}

export async function updateTenantGroup(
  groupId: string,
  input: UpdateGroupValues,
): Promise<UserGroup> {
  const payload = {
    name: input.name,
    slug: input.slug && input.slug.length > 0 ? input.slug : undefined,
    description: input.description && input.description.length > 0 ? input.description : undefined,
    status: input.status,
  };
  return api.patch<UserGroup>(`/groups/${groupId}`, payload);
}

export async function archiveTenantGroup(groupId: string): Promise<UserGroup> {
  return api.delete<UserGroup>(`/groups/${groupId}`);
}

export async function getTenantGroupMembers(
  groupId: string,
  params?: { page?: number; limit?: number },
  signal?: AbortSignal,
): Promise<PaginatedResult<TenantGroupMember>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const queryStr = qs.toString();
  const data = await api.get<unknown>(
    `/groups/${groupId}/members${queryStr ? `?${queryStr}` : ""}`,
    { signal },
  );
  return normalizePaginatedResult<TenantGroupMember>(data, params?.limit);
}

export async function addTenantGroupMembers(
  groupId: string,
  userIds: string[],
): Promise<{ addedCount: number; skippedCount: number }> {
  return api.post<{ addedCount: number; skippedCount: number }>(`/groups/${groupId}/members`, {
    userIds,
  });
}

export async function removeTenantGroupMember(
  groupId: string,
  userId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/groups/${groupId}/members/${userId}`);
}

// ============================================================================
// PLATFORM API FUNCTIONS
// ============================================================================

export async function getPlatformGroups(
  filters?: GroupFilters,
  signal?: AbortSignal,
): Promise<PaginatedResult<UserGroup>> {
  const data = await api.get<unknown>(`/platform/groups${buildQuery(filters)}`, { signal });
  return normalizePaginatedResult<UserGroup>(data, filters?.limit);
}

export async function getPlatformGroup(groupId: string, signal?: AbortSignal): Promise<UserGroup> {
  return api.get<UserGroup>(`/platform/groups/${groupId}`, { signal });
}

export async function createPlatformGroup(input: CreateGroupValues): Promise<UserGroup> {
  const payload = {
    name: input.name,
    slug: input.slug && input.slug.length > 0 ? input.slug : undefined,
    description: input.description && input.description.length > 0 ? input.description : undefined,
  };
  return api.post<UserGroup>("/platform/groups", payload);
}

export async function updatePlatformGroup(
  groupId: string,
  input: UpdateGroupValues,
): Promise<UserGroup> {
  const payload = {
    name: input.name,
    slug: input.slug && input.slug.length > 0 ? input.slug : undefined,
    description: input.description && input.description.length > 0 ? input.description : undefined,
    status: input.status,
  };
  return api.patch<UserGroup>(`/platform/groups/${groupId}`, payload);
}

export async function archivePlatformGroup(groupId: string): Promise<UserGroup> {
  return api.delete<UserGroup>(`/platform/groups/${groupId}`);
}

export async function getPlatformGroupMembers(
  groupId: string,
  params?: { page?: number; limit?: number },
  signal?: AbortSignal,
): Promise<PaginatedResult<PlatformGroupMember>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const queryStr = qs.toString();
  const data = await api.get<unknown>(
    `/platform/groups/${groupId}/members${queryStr ? `?${queryStr}` : ""}`,
    { signal },
  );
  return normalizePaginatedResult<PlatformGroupMember>(data, params?.limit);
}

export async function addPlatformGroupMembers(
  groupId: string,
  staffIds: string[],
): Promise<{ addedCount: number; skippedCount: number }> {
  return api.post<{ addedCount: number; skippedCount: number }>(
    `/platform/groups/${groupId}/members`,
    {
      staffIds,
    },
  );
}

export async function removePlatformGroupMember(
  groupId: string,
  staffId: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/platform/groups/${groupId}/members/${staffId}`);
}
