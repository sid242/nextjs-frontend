"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import { groupKeys } from "./keys";
import type { CreateGroupValues, UpdateGroupValues } from "./schemas";
import type { GroupFilters } from "./types";

// ============================================================================
// TENANT QUERIES & MUTATIONS
// ============================================================================

export const tenantGroupsQueryOptions = (tenantId?: string, filters?: GroupFilters) =>
  queryOptions({
    queryKey: groupKeys.tenantList(tenantId, filters),
    queryFn: ({ signal }) => api.getTenantGroups(filters, signal),
    enabled: Boolean(tenantId),
  });

export function useTenantGroups(tenantId?: string, filters?: GroupFilters) {
  return useQuery(tenantGroupsQueryOptions(tenantId, filters));
}

export const tenantGroupDetailQueryOptions = (tenantId?: string, groupId?: string) =>
  queryOptions({
    queryKey: groupKeys.tenantDetail(tenantId, groupId),
    queryFn: ({ signal }) => api.getTenantGroup(groupId!, signal),
    enabled: Boolean(tenantId && groupId),
  });

export function useTenantGroup(tenantId?: string, groupId?: string) {
  return useQuery(tenantGroupDetailQueryOptions(tenantId, groupId));
}

export const tenantGroupMembersQueryOptions = (
  tenantId?: string,
  groupId?: string,
  params?: { page?: number; limit?: number },
) =>
  queryOptions({
    queryKey: groupKeys.tenantMembers(tenantId, groupId, params?.page),
    queryFn: ({ signal }) => api.getTenantGroupMembers(groupId!, params, signal),
    enabled: Boolean(tenantId && groupId),
  });

export function useTenantGroupMembers(
  tenantId?: string,
  groupId?: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery(tenantGroupMembersQueryOptions(tenantId, groupId, params));
}

export function useCreateTenantGroup(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupValues) => api.createTenantGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
    },
  });
}

export function useUpdateTenantGroup(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, input }: { groupId: string; input: UpdateGroupValues }) =>
      api.updateTenantGroup(groupId, input),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantDetail(tenantId, groupId) });
    },
  });
}

export function useArchiveTenantGroup(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => api.archiveTenantGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
    },
  });
}

export function useAddTenantGroupMembers(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      api.addTenantGroupMembers(groupId, userIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantMembers(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
    },
  });
}

export function useRemoveTenantGroupMember(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      api.removeTenantGroupMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantMembers(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
    },
  });
}

export const tenantGroupRolesQueryOptions = (tenantId?: string, groupId?: string) =>
  queryOptions({
    queryKey: groupKeys.tenantRoles(tenantId, groupId),
    queryFn: ({ signal }) => api.getTenantGroupRoles(groupId!, signal),
    enabled: Boolean(tenantId && groupId),
  });

export function useTenantGroupRoles(tenantId?: string, groupId?: string) {
  return useQuery(tenantGroupRolesQueryOptions(tenantId, groupId));
}

export const tenantGroupPermissionsQueryOptions = (tenantId?: string, groupId?: string) =>
  queryOptions({
    queryKey: groupKeys.tenantPermissions(tenantId, groupId),
    queryFn: ({ signal }) => api.getTenantGroupPermissions(groupId!, signal),
    enabled: Boolean(tenantId && groupId),
  });

export function useTenantGroupPermissions(tenantId?: string, groupId?: string) {
  return useQuery(tenantGroupPermissionsQueryOptions(tenantId, groupId));
}

export function useBindTenantGroupRole(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      input,
    }: {
      groupId: string;
      input: { roleId?: string; roleIds?: string[]; reason?: string };
    }) => api.bindTenantGroupRole(groupId, input),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantRoles(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantPermissions(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "context"] });
      queryClient.invalidateQueries({ queryKey: ["rbac", "tenants", tenantId, "roles"] });
    },
  });
}

export function useUnbindTenantGroupRole(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, roleId }: { groupId: string; roleId: string }) =>
      api.unbindTenantGroupRole(groupId, roleId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantRoles(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantPermissions(tenantId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.tenantAll(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "context"] });
      queryClient.invalidateQueries({ queryKey: ["rbac", "tenants", tenantId, "roles"] });
    },
  });
}

// ============================================================================
// PLATFORM QUERIES & MUTATIONS
// ============================================================================

export const platformGroupsQueryOptions = (filters?: GroupFilters) =>
  queryOptions({
    queryKey: groupKeys.platformList(filters),
    queryFn: ({ signal }) => api.getPlatformGroups(filters, signal),
  });

export function usePlatformGroups(filters?: GroupFilters) {
  return useQuery(platformGroupsQueryOptions(filters));
}

export const platformGroupDetailQueryOptions = (groupId?: string) =>
  queryOptions({
    queryKey: groupKeys.platformDetail(groupId),
    queryFn: ({ signal }) => api.getPlatformGroup(groupId!, signal),
    enabled: Boolean(groupId),
  });

export function usePlatformGroup(groupId?: string) {
  return useQuery(platformGroupDetailQueryOptions(groupId));
}

export const platformGroupMembersQueryOptions = (
  groupId?: string,
  params?: { page?: number; limit?: number },
) =>
  queryOptions({
    queryKey: groupKeys.platformMembers(groupId, params?.page),
    queryFn: ({ signal }) => api.getPlatformGroupMembers(groupId!, params, signal),
    enabled: Boolean(groupId),
  });

export function usePlatformGroupMembers(
  groupId?: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery(platformGroupMembersQueryOptions(groupId, params));
}

export function useCreatePlatformGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupValues) => api.createPlatformGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.platformAll });
    },
  });
}

export function useUpdatePlatformGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, input }: { groupId: string; input: UpdateGroupValues }) =>
      api.updatePlatformGroup(groupId, input),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.platformAll });
      queryClient.invalidateQueries({ queryKey: groupKeys.platformDetail(groupId) });
    },
  });
}

export function useArchivePlatformGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => api.archivePlatformGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.platformAll });
    },
  });
}

export function useAddPlatformGroupMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, staffIds }: { groupId: string; staffIds: string[] }) =>
      api.addPlatformGroupMembers(groupId, staffIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.platformMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.platformAll });
    },
  });
}

export function useRemovePlatformGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, staffId }: { groupId: string; staffId: string }) =>
      api.removePlatformGroupMember(groupId, staffId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.platformMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.platformAll });
    },
  });
}
