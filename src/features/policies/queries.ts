"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attachPolicyToRole,
  createPolicy,
  deletePolicy,
  detachPolicyFromRole,
  getPolicies,
  getPolicy,
  getRolePolicies,
  updatePolicy,
} from "./api";
import type { CreatePolicyInput, ListPoliciesFilter, UpdatePolicyInput } from "./types";

export const policiesKeys = {
  all: ["policies"] as const,
  lists: () => [...policiesKeys.all, "list"] as const,
  list: (filters?: ListPoliciesFilter) => [...policiesKeys.lists(), filters] as const,
  details: () => [...policiesKeys.all, "detail"] as const,
  detail: (id: string) => [...policiesKeys.details(), id] as const,
  rolePolicies: (roleId: string) => [...policiesKeys.all, "role", roleId] as const,
};

export const policiesListQueryOptions = (filters?: ListPoliciesFilter) =>
  queryOptions({
    queryKey: policiesKeys.list(filters),
    queryFn: ({ signal }) => getPolicies(filters, signal),
    staleTime: 30 * 1000,
  });

export function usePolicies(filters?: ListPoliciesFilter) {
  return useQuery(policiesListQueryOptions(filters));
}

export function usePolicy(policyId: string) {
  return useQuery({
    queryKey: policiesKeys.detail(policyId),
    queryFn: ({ signal }) => getPolicy(policyId, signal),
    enabled: Boolean(policyId),
  });
}

export function useRolePolicies(roleId: string) {
  return useQuery({
    queryKey: policiesKeys.rolePolicies(roleId),
    queryFn: ({ signal }) => getRolePolicies(roleId, signal),
    enabled: Boolean(roleId),
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePolicyInput) => createPolicy(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policiesKeys.all });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, input }: { policyId: string; input: UpdatePolicyInput }) =>
      updatePolicy(policyId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: policiesKeys.detail(vars.policyId) });
      queryClient.invalidateQueries({ queryKey: policiesKeys.lists() });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => deletePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policiesKeys.all });
    },
  });
}

export function useAttachPolicyToRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, roleId }: { policyId: string; roleId: string }) =>
      attachPolicyToRole(policyId, roleId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: policiesKeys.rolePolicies(vars.roleId) });
      queryClient.invalidateQueries({ queryKey: policiesKeys.all });
    },
  });
}

export function useDetachPolicyFromRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, roleId }: { policyId: string; roleId: string }) =>
      detachPolicyFromRole(policyId, roleId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: policiesKeys.rolePolicies(vars.roleId) });
      queryClient.invalidateQueries({ queryKey: policiesKeys.all });
    },
  });
}
