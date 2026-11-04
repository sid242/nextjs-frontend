"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTenantRole,
  deleteTenantRole,
  getPlatformModules,
  getPlatformPermissions,
  getTenantRoles,
  updateTenantRole,
} from "./api";
import { rbacKeys } from "./keys";
import type { CreateRoleInput, ListRolesFilter, UpdateRoleInput } from "./schemas";

export const tenantRolesQueryOptions = (tenantId: string, params?: ListRolesFilter) =>
  queryOptions({
    queryKey: [...rbacKeys.roles(tenantId), params],
    queryFn: ({ signal }) => getTenantRoles(tenantId, params, signal),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });

export const permissionsQueryOptions = () =>
  queryOptions({
    queryKey: rbacKeys.permissions(),
    queryFn: ({ signal }) => getPlatformPermissions(signal),
    staleTime: 10 * 60 * 1000,
  });

export const modulesQueryOptions = () =>
  queryOptions({
    queryKey: rbacKeys.modules(),
    queryFn: ({ signal }) => getPlatformModules(signal),
    staleTime: 10 * 60 * 1000,
  });

export function useTenantRoles(tenantId?: string | null, params?: ListRolesFilter) {
  return useQuery(tenantRolesQueryOptions(tenantId ?? "", params));
}

export function usePermissions() {
  return useQuery(permissionsQueryOptions());
}

export function useModules() {
  return useQuery(modulesQueryOptions());
}

export function useCreateTenantRole(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => createTenantRole(tenantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
}

export function useUpdateTenantRole(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) =>
      updateTenantRole(tenantId, roleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
}

export function useDeleteTenantRole(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteTenantRole(tenantId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(tenantId) });
    },
  });
}
