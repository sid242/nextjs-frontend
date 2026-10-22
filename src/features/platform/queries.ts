"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPlatformRole,
  createStaffMember,
  endSupportSession,
  getPlatformAuditLogs,
  getPlatformMe,
  getPlatformPermissions,
  getPlatformRoles,
  getStaffMembers,
  getSupportSessions,
  loginPlatformStaff,
  logoutPlatformStaff,
  startSupportSession,
  updatePlatformRole,
  updateStaffMember,
} from "./api";
import { platformKeys } from "./keys";
import type {
  CreatePlatformRoleInput,
  CreateStaffInput,
  PlatformLoginInput,
  StartSupportSessionInput,
  UpdatePlatformRoleInput,
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

export function useSupportSessions(params?: { page?: number; limit?: number }) {
  return useQuery(supportSessionsQueryOptions(params));
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
