import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type { CreatePolicyInput, ListPoliciesFilter, Policy, UpdatePolicyInput } from "./types";

export async function getPolicies(
  params?: ListPoliciesFilter,
  signal?: AbortSignal,
): Promise<{ items: Policy[]; total: number; page: number; limit: number }> {
  const qs = buildQueryString(params);
  const res = await api.get<
    | Policy[]
    | {
        items?: Policy[];
        data?: Policy[];
        meta?: { total?: number; page?: number; limit?: number };
      }
  >(`/policies${qs}`, { signal });
  if (Array.isArray(res)) {
    return { items: res, total: res.length, page: 1, limit: res.length };
  }
  if (res && Array.isArray(res.items)) {
    return {
      items: res.items,
      total: res.meta?.total ?? res.items.length,
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? 20,
    };
  }
  if (res && Array.isArray(res.data)) {
    return {
      items: res.data,
      total: res.meta?.total ?? res.data.length,
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? 20,
    };
  }
  return { items: [], total: 0, page: 1, limit: 20 };
}

export async function getPolicy(policyId: string, signal?: AbortSignal): Promise<Policy> {
  return api.get<Policy>(`/policies/${policyId}`, { signal });
}

export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  return api.post<Policy>("/policies", input);
}

export async function updatePolicy(policyId: string, input: UpdatePolicyInput): Promise<Policy> {
  return api.patch<Policy>(`/policies/${policyId}`, input);
}

export async function deletePolicy(policyId: string): Promise<void> {
  await api.delete(`/policies/${policyId}`);
}

export async function attachPolicyToRole(policyId: string, roleId: string): Promise<void> {
  await api.post(`/policies/${policyId}/roles/${roleId}`, {});
}

export async function detachPolicyFromRole(policyId: string, roleId: string): Promise<void> {
  await api.delete(`/policies/${policyId}/roles/${roleId}`);
}

export async function getRolePolicies(roleId: string, signal?: AbortSignal): Promise<Policy[]> {
  const res = await api.get<Policy[] | { data: Policy[] }>(`/policies/roles/${roleId}`, {
    signal,
  });
  if (Array.isArray(res)) return res;
  if (res && "data" in res && Array.isArray(res.data)) return res.data;
  return [];
}
