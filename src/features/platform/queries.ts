"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateTenant,
  createPlatformRole,
  createStaffMember,
  disablePlatformTwoFactor,
  enablePlatformTwoFactor,
  endSupportSession,
  getPlatformAuditLogs,
  getPlatformMe,
  getPlatformPermissions,
  getPlatformRoles,
  getPlatformTenant,
  getPlatformTenants,
  getPlatformTwoFactorStatus,
  getStaffMembers,
  getSupportSessions,
  getTenantMembers,
  loginPlatformStaff,
  logoutPlatformStaff,
  provisionTenant,
  setupPlatformTwoFactor,
  startSupportSession,
  suspendTenant,
  updatePlatformRole,
  updatePlatformTenant,
  updatePlatformTenantSubscription,
  updateStaffMember,
  verifyPlatformTwoFactor,
} from "./api";
import { platformKeys } from "./keys";
import type {
  CreatePlatformRoleInput,
  CreateStaffInput,
  PlatformLoginInput,
  ProvisionTenantInput,
  StartSupportSessionInput,
  UpdatePlatformRoleInput,
  UpdatePlatformTenantInput,
  UpdatePlatformTenantSubscriptionInput,
  UpdateStaffInput,
} from "./schemas";

// ==========================================
// 1. Staff Management Hooks
// ==========================================

export const staffListQueryOptions = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  roleId?: string;
}) =>
  queryOptions({
    queryKey: platformKeys.staffList(params),
    queryFn: ({ signal }) => getStaffMembers(params, signal),
  });

export function useStaffList(params?: {
  page?: number;
  limit?: number;
  status?: string;
  roleId?: string;
}) {
  return useQuery(staffListQueryOptions(params));
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaffMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.staff() });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) =>
      updateStaffMember(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.staff() });
    },
  });
}

// ==========================================
// 2. Platform Roles & Permissions Hooks
// ==========================================

export const platformRolesQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.rolesList(),
    queryFn: ({ signal }) => getPlatformRoles(signal),
  });

export function usePlatformRoles() {
  return useQuery(platformRolesQueryOptions());
}

export function useCreatePlatformRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlatformRoleInput) => createPlatformRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.roles() });
    },
  });
}

export function useUpdatePlatformRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlatformRoleInput }) =>
      updatePlatformRole(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.roles() });
    },
  });
}

export const platformPermissionsQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.permissions(),
    queryFn: ({ signal }) => getPlatformPermissions(signal),
  });

export function usePlatformPermissions() {
  return useQuery(platformPermissionsQueryOptions());
}

// ==========================================
// 3. Audited Support Sessions Hooks
// ==========================================

export const supportSessionsQueryOptions = (params?: { page?: number; limit?: number }) =>
  queryOptions({
    queryKey: platformKeys.supportSessionsList(params),
    queryFn: ({ signal }) => getSupportSessions(params, signal),
  });

export function useSupportSessions(
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    ...supportSessionsQueryOptions(params),
    enabled: options?.enabled,
  });
}

export function useStartSupportSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartSupportSessionInput) => startSupportSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.supportSessions() });
      queryClient.invalidateQueries({ queryKey: platformKeys.auditLogs() });
    },
  });
}

export function useEndSupportSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, outcome }: { sessionId: string; outcome?: string }) =>
      endSupportSession(sessionId, outcome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.supportSessions() });
      queryClient.invalidateQueries({ queryKey: platformKeys.auditLogs() });
    },
  });
}

// ==========================================
// 4. Platform Audit Trail Hooks
// ==========================================

export const platformAuditLogsQueryOptions = (params?: {
  page?: number;
  limit?: number;
  actorStaffId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}) =>
  queryOptions({
    queryKey: platformKeys.auditLogsList(params),
    queryFn: ({ signal }) => getPlatformAuditLogs(params, signal),
  });

export function usePlatformAuditLogs(params?: {
  page?: number;
  limit?: number;
  actorStaffId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery(platformAuditLogsQueryOptions(params));
}

// ==========================================
// 5. Staff Authentication Hooks
// ==========================================

export const platformMeQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.me(),
    queryFn: ({ signal }) => getPlatformMe(signal),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

export function usePlatformMe() {
  return useQuery(platformMeQueryOptions());
}

export function usePlatformLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: PlatformLoginInput) => loginPlatformStaff(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.me() });
    },
  });
}

export function usePlatformLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutPlatformStaff(),
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Hard navigation needed to clear platform session state
        window.location.assign("/platform/login");
      }
    },
  });
}

export const platformTwoFactorStatusQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.twoFactorStatus(),
    queryFn: ({ signal }) => getPlatformTwoFactorStatus(signal),
    staleTime: 60 * 1000,
  });

export function usePlatformTwoFactorStatus() {
  return useQuery(platformTwoFactorStatusQueryOptions());
}

export function useSetupPlatformTwoFactor() {
  return useMutation({
    mutationFn: () => setupPlatformTwoFactor(),
  });
}

export function useEnablePlatformTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string }) => enablePlatformTwoFactor(input),
    onSuccess: () => {
      queryClient.setQueryData(platformKeys.twoFactorStatus(), {
        enabled: true,
        enabledAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.me() });
    },
  });
}

export function useDisablePlatformTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { password: string; code: string }) => disablePlatformTwoFactor(input),
    onSuccess: () => {
      queryClient.setQueryData(platformKeys.twoFactorStatus(), {
        enabled: false,
        enabledAt: null,
      });
      queryClient.invalidateQueries({ queryKey: platformKeys.me() });
    },
  });
}

export function useVerifyPlatformTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { challengeToken: string; code: string }) => verifyPlatformTwoFactor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.me() });
    },
  });
}

// ==========================================
// 6. Platform Tenant Oversight & Provisioning Hooks
// ==========================================

export const platformTenantsQueryOptions = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
  databaseMode?: string;
}) =>
  queryOptions({
    queryKey: platformKeys.tenantsList(params),
    queryFn: ({ signal }) => getPlatformTenants(params, signal),
  });

export function usePlatformTenants(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
  databaseMode?: string;
}) {
  return useQuery(platformTenantsQueryOptions(params));
}

export const platformTenantDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: platformKeys.tenantDetail(id),
    queryFn: ({ signal }) => getPlatformTenant(id, signal),
    enabled: Boolean(id),
  });

export function usePlatformTenant(id: string) {
  return useQuery(platformTenantDetailQueryOptions(id));
}

export const platformTenantMembersQueryOptions = (tenantId: string) =>
  queryOptions({
    queryKey: platformKeys.tenantMembers(tenantId),
    queryFn: ({ signal }) => getTenantMembers(tenantId, signal),
    enabled: Boolean(tenantId),
  });

export function usePlatformTenantMembers(tenantId: string) {
  return useQuery(platformTenantMembersQueryOptions(tenantId));
}

export function useProvisionTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProvisionTenantInput) => provisionTenant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.tenants() });
    },
  });
}

export function useUpdatePlatformTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlatformTenantInput) => updatePlatformTenant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.tenantDetail(id) });
      queryClient.invalidateQueries({ queryKey: platformKeys.tenants() });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendTenant(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.tenantDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: platformKeys.tenants() });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => activateTenant(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.tenantDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: platformKeys.tenants() });
    },
  });
}

export function useUpdatePlatformTenantSubscription(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlatformTenantSubscriptionInput) =>
      updatePlatformTenantSubscription(tenantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.tenantDetail(tenantId) });
      queryClient.invalidateQueries({ queryKey: platformKeys.tenants() });
    },
  });
}
