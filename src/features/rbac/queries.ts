"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTenantRole, deleteTenantRole, getPlatformPermissions, getTenantRoles } from "./api";
import { rbacKeys } from "./keys";
import type { CreateRoleInput, Role } from "./schemas";

export const tenantRolesQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: rbacKeys.roles(tenantId),
    queryFn: ({ signal }) => getTenantRoles(tenantId, signal),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });

export const permissionsQueryOptions = () =>
  queryOptions({
    queryKey: rbacKeys.permissions(),
    queryFn: ({ signal }) => getPlatformPermissions(signal),
    staleTime: 10 * 60 * 1000,
  });

export function useTenantRoles(tenantId?: string | null) {
  return useQuery(tenantRolesQueryOptions(tenantId ?? ""));
}

export function usePermissions() {
  return useQuery(permissionsQueryOptions());
}

export function useCreateTenantRole(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => createTenantRole(tenantId, input),
    onSuccess: (newRole) => {
      queryClient.setQueryData<Role[]>(rbacKeys.roles(tenantId), (old = []) => [...old, newRole]);
    },
  });
}

export function useDeleteTenantRole(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteTenantRole(tenantId, roleId),
    onSuccess: (_, roleId) => {
      queryClient.setQueryData<Role[]>(rbacKeys.roles(tenantId), (old = []) =>
        old.filter((r) => r.id !== roleId),
      );
    },
  });
}
