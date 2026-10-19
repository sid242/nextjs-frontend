"use client";

import { queryOptions, useQueryClient } from "@tanstack/react-query";

import {
  useAppMutation,
  useAppQuery,
  type MutationOverrides,
  type QueryOverrides,
} from "@/lib/query/hooks";

import {
  addTenantMember,
  createTenant,
  getTenantAuditLogs,
  getTenantBranding,
  getTenantEmailConfig,
  getTenantMembers,
  getTenantModules,
  getTenants,
  removeTenantMember,
  saveTenantEmailConfig,
  searchTenantAuditLogs,
  testTenantEmailConfig,
  toggleTenantModule,
  updateTenant,
  updateTenantBranding,
  updateTenantMemberRole,
} from "./api";
import { tenantKeys } from "./keys";
import type {
  AddMemberInput,
  AuditLogEntry,
  CreateTenantInput,
  SearchAuditLogsInput,
  Tenant,
  TenantBranding,
  TenantEmailConfig,
  TenantMember,
  TenantModule,
  TestEmailInput,
  UpdateTenantBrandingInput,
} from "./schemas";
import { useTenantStore } from "./store";

export const tenantsQueryOptions = () =>
  queryOptions({
    queryKey: tenantKeys.list(),
    queryFn: ({ signal }) => getTenants(signal),
    staleTime: 5 * 60 * 1000,
  });

export const tenantBrandingQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: tenantKeys.branding(tenantId),
    queryFn: ({ signal }) => getTenantBranding(tenantId, signal),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

export const tenantMembersQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: tenantKeys.members(tenantId),
    queryFn: ({ signal }) => getTenantMembers(tenantId, signal),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });

export const tenantEmailConfigQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: tenantKeys.emailConfig(tenantId),
    queryFn: ({ signal }) => getTenantEmailConfig(tenantId, signal),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

export const tenantAuditLogsQueryOptions = (tenantId: string, page = 1) =>
  queryOptions({
    queryKey: tenantKeys.auditLogs(tenantId, page),
    queryFn: ({ signal }) => getTenantAuditLogs(tenantId, page, 50, signal),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });

export const tenantAuditLogsSearchQueryOptions = (
  tenantId: string,
  criteria: Partial<SearchAuditLogsInput> = {},
) => {
  const fullCriteria: SearchAuditLogsInput = { page: 1, limit: 50, ...criteria };
  return queryOptions({
    queryKey: tenantKeys.auditLogsSearch(tenantId, fullCriteria as Record<string, unknown>),
    queryFn: ({ signal }) => searchTenantAuditLogs(tenantId, fullCriteria, signal),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
};

export function useTenants(options?: QueryOverrides<Tenant[]>) {
  return useAppQuery<Tenant[]>(tenantsQueryOptions(), options);
}

export function useTenantBranding(
  tenantId?: string | null,
  options?: QueryOverrides<TenantBranding | null>,
) {
  return useAppQuery<TenantBranding | null>(tenantBrandingQueryOptions(tenantId ?? ""), options);
}

export function useTenantMembers(
  tenantId?: string | null,
  options?: QueryOverrides<TenantMember[]>,
) {
  return useAppQuery<TenantMember[]>(tenantMembersQueryOptions(tenantId ?? ""), options);
}

export function useTenantEmailConfig(
  tenantId?: string | null,
  options?: QueryOverrides<TenantEmailConfig | null>,
) {
  return useAppQuery<TenantEmailConfig | null>(
    tenantEmailConfigQueryOptions(tenantId ?? ""),
    options,
  );
}

export function useTenantAuditLogs(
  tenantId?: string | null,
  page = 1,
  options?: QueryOverrides<AuditLogEntry[]>,
) {
  return useAppQuery<AuditLogEntry[]>(tenantAuditLogsQueryOptions(tenantId ?? "", page), options);
}

export function useTenantAuditLogsSearch(
  tenantId?: string | null,
  criteria: Partial<SearchAuditLogsInput> = {},
  options?: QueryOverrides<AuditLogEntry[]>,
) {
  return useAppQuery<AuditLogEntry[]>(
    tenantAuditLogsSearchQueryOptions(tenantId ?? "", criteria),
    options,
  );
}

export function useActiveTenant() {
  const { data: tenants = [], isLoading } = useTenants();
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);

  const activeTenant: Tenant | undefined =
    tenants?.find((t) => t?.id === activeTenantId) ?? tenants?.[0];

  return {
    activeTenant,
    tenants,
    activeTenantId: activeTenant?.id ?? null,
    setActiveTenantId,
    isLoading,
  };
}

export function useCreateTenant(options?: MutationOverrides<Tenant, CreateTenantInput>) {
  const queryClient = useQueryClient();
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);

  return useAppMutation(
    {
      mutationFn: (input: CreateTenantInput) => createTenant(input),
      onSuccess: (newTenant: Tenant) => {
        queryClient.setQueryData<Tenant[]>(tenantKeys.list(), (old = []) => [
          ...(old ?? []),
          newTenant,
        ]);
        setActiveTenantId(newTenant.id);
      },
    },
    options,
  );
}

export function useAddTenantMember(
  tenantId: string,
  options?: MutationOverrides<{ member: TenantMember }, AddMemberInput>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: (input: AddMemberInput) => addTenantMember(tenantId, input),
      onSuccess: (res: { member: TenantMember }) => {
        queryClient.setQueryData<TenantMember[]>(tenantKeys.members(tenantId), (old = []) => [
          ...(old ?? []),
          res?.member,
        ]);
      },
    },
    options,
  );
}

export function useRemoveTenantMember(tenantId: string, options?: MutationOverrides<void, string>) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: (memberId: string) => removeTenantMember(tenantId, memberId),
      onSuccess: (_: void, memberId: string) => {
        queryClient.setQueryData<TenantMember[]>(
          tenantKeys.members(tenantId),
          (old = []) => old?.filter((m) => m?.id !== memberId) ?? [],
        );
      },
    },
    options,
  );
}

export function useUpdateMemberRole(
  tenantId: string,
  options?: MutationOverrides<void, { memberId: string; role: string }>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
        updateTenantMemberRole(tenantId, memberId, role),
      onSuccess: (_: void, { memberId, role }: { memberId: string; role: string }) => {
        queryClient.setQueryData<TenantMember[]>(
          tenantKeys.members(tenantId),
          (old = []) => old?.map((m) => (m?.id === memberId ? { ...m, role } : m)) ?? [],
        );
      },
    },
    options,
  );
}

export function useUpdateTenantBranding(
  tenantId: string,
  options?: MutationOverrides<TenantBranding, UpdateTenantBrandingInput>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: (input: UpdateTenantBrandingInput) => updateTenantBranding(tenantId, input),
      onSuccess: (updated: TenantBranding) => {
        queryClient.setQueryData(tenantKeys.branding(tenantId), updated);
      },
    },
    options,
  );
}

export function useSaveTenantEmailConfig(
  tenantId: string,
  options?: MutationOverrides<void, TenantEmailConfig>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: (input: TenantEmailConfig) => saveTenantEmailConfig(tenantId, input),
      onSuccess: (_: void, input: TenantEmailConfig) => {
        queryClient.setQueryData(tenantKeys.emailConfig(tenantId), input);
      },
    },
    options,
  );
}

export function useTestTenantEmailConfig(
  tenantId: string,
  options?: MutationOverrides<{ success: boolean; message: string }, TestEmailInput>,
) {
  return useAppMutation(
    {
      mutationFn: (input: TestEmailInput) => testTenantEmailConfig(tenantId, input),
    },
    options,
  );
}

export function useUpdateTenant(
  tenantId: string,
  options?: MutationOverrides<Tenant, { name?: string; plan?: "FREE" | "PRO" | "ENTERPRISE" }>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: (input: { name?: string; plan?: "FREE" | "PRO" | "ENTERPRISE" }) =>
        updateTenant(tenantId, input),
      onSuccess: (updated: Tenant) => {
        queryClient.setQueryData<Tenant[]>(
          tenantKeys.list(),
          (old = []) => old?.map((t) => (t?.id === tenantId ? { ...t, ...updated } : t)) ?? [],
        );
      },
    },
    options,
  );
}

export const tenantModulesQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: tenantKeys.modules(tenantId),
    queryFn: ({ signal }) => getTenantModules(tenantId, signal),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });

export function useTenantModules(
  tenantId?: string | null,
  options?: QueryOverrides<TenantModule[]>,
) {
  return useAppQuery<TenantModule[]>(tenantModulesQueryOptions(tenantId ?? ""), options);
}

export function useToggleTenantModule(
  tenantId: string,
  options?: MutationOverrides<void, { moduleId: string; isEnabled: boolean }>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) =>
        toggleTenantModule(tenantId, moduleId, isEnabled),
      onSuccess: (_: void, { moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) => {
        queryClient.setQueryData<
          { id: string; key: string; name: string; description?: string; isEnabled: boolean }[]
        >(
          tenantKeys.modules(tenantId),
          (old = []) => old?.map((m) => (m?.id === moduleId ? { ...m, isEnabled } : m)) ?? [],
        );
      },
    },
    options,
  );
}
