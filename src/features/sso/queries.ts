import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createScimToken,
  getTenantSsoConfig,
  listScimTokens,
  lookupSso,
  revokeScimToken,
  testSsoConnection,
  updateTenantSsoConfig,
} from "./api";
import { ssoKeys } from "./keys";
import type {
  CreateScimTokenInput,
  TestSsoConnectionInput,
  UpdateTenantSsoConfigInput,
} from "./types";

export function useTenantSsoConfig(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? ssoKeys.config(tenantId) : ssoKeys.all,
    queryFn: ({ signal }) => getTenantSsoConfig(tenantId!, signal),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useUpdateTenantSsoConfig(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantSsoConfigInput) => updateTenantSsoConfig(tenantId!, input),
    onSuccess: (data) => {
      if (tenantId) {
        queryClient.setQueryData(ssoKeys.config(tenantId), data);
      }
    },
  });
}

export function useTestSsoConnection(tenantId?: string) {
  return useMutation({
    mutationFn: (input: TestSsoConnectionInput) => testSsoConnection(tenantId!, input),
  });
}

export function useScimTokens(tenantId?: string) {
  return useQuery({
    queryKey: tenantId ? ssoKeys.tokens(tenantId) : ssoKeys.all,
    queryFn: ({ signal }) => listScimTokens(tenantId!, signal),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useCreateScimToken(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScimTokenInput) => createScimToken(tenantId!, input),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ssoKeys.tokens(tenantId) });
      }
    },
  });
}

export function useRevokeScimToken(tenantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => revokeScimToken(tenantId!, tokenId),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ssoKeys.tokens(tenantId) });
      }
    },
  });
}

export function useSsoLookup() {
  return useMutation({
    mutationFn: (email: string) => lookupSso(email),
  });
}
