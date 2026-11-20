"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import type { RequestAccountDeletionInput, RequestTenantClosureInput } from "./schemas";
import type { DataExportRequest } from "./types";

export const privacyKeys = {
  all: ["privacy"] as const,
  userExports: () => [...privacyKeys.all, "user-exports"] as const,
  accountDeletion: () => [...privacyKeys.all, "account-deletion"] as const,
  tenantExports: (tenantId: string) => [...privacyKeys.all, "tenant-exports", tenantId] as const,
  tenantClosure: (tenantId: string) => [...privacyKeys.all, "tenant-closure", tenantId] as const,
  consentStatus: () => [...privacyKeys.all, "consent-status"] as const,
};

// User hooks
export function useUserDataExports() {
  return useQuery({
    queryKey: privacyKeys.userExports(),
    queryFn: () => api.listUserDataExports(),
    staleTime: 60 * 1000,
  });
}

export function useRequestUserDataExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.requestUserDataExport(),
    onSuccess: (newExport) => {
      queryClient.setQueryData<DataExportRequest[]>(privacyKeys.userExports(), (old) => {
        if (!Array.isArray(old)) return [newExport];
        return [newExport, ...old];
      });
    },
  });
}

export function useAccountDeletionStatus() {
  return useQuery({
    queryKey: privacyKeys.accountDeletion(),
    queryFn: () => api.getAccountDeletionStatus(),
    staleTime: 60 * 1000,
  });
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestAccountDeletionInput) => api.requestAccountDeletion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.accountDeletion() });
    },
  });
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.cancelAccountDeletion(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.accountDeletion() });
    },
  });
}

// Tenant hooks
export function useTenantDataExports(tenantId: string) {
  return useQuery({
    queryKey: privacyKeys.tenantExports(tenantId),
    queryFn: () => api.listTenantDataExports(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useRequestTenantDataExport(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.requestTenantDataExport(tenantId),
    onSuccess: (newExport) => {
      queryClient.setQueryData<DataExportRequest[]>(privacyKeys.tenantExports(tenantId), (old) => {
        if (!Array.isArray(old)) return [newExport];
        return [newExport, ...old];
      });
    },
  });
}

export function useTenantClosureStatus(tenantId: string) {
  return useQuery({
    queryKey: privacyKeys.tenantClosure(tenantId),
    queryFn: () => api.getTenantClosureStatus(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useRequestTenantClosure(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestTenantClosureInput) => api.requestTenantClosure(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.tenantClosure(tenantId) });
    },
  });
}

export function useCancelTenantClosure(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.cancelTenantClosure(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.tenantClosure(tenantId) });
    },
  });
}

// Consent hooks
export function useConsentStatus() {
  return useQuery({
    queryKey: privacyKeys.consentStatus(),
    queryFn: () => api.getConsentStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: string; version: string; tenantId?: string }) =>
      api.recordConsent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.consentStatus() });
    },
  });
}
