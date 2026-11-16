import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type { CreateLeadInput, Lead, ListLeadsFilter, UpdateLeadInput } from "./types";

export async function getLeads(
  params?: ListLeadsFilter,
  signal?: AbortSignal,
): Promise<{ items: Lead[]; total: number; page: number; limit: number }> {
  const qs = buildQueryString(params);
  const res = await api.get<
    | Lead[]
    | { items?: Lead[]; data?: Lead[]; meta?: { total?: number; page?: number; limit?: number } }
  >(`/leads${qs}`, { signal });
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

export async function getLead(leadId: string, signal?: AbortSignal): Promise<Lead> {
  return api.get<Lead>(`/leads/${leadId}`, { signal });
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  return api.post<Lead>("/leads", input);
}

export async function updateLead(leadId: string, input: UpdateLeadInput): Promise<Lead> {
  return api.patch<Lead>(`/leads/${leadId}`, input);
}

export async function deleteLead(leadId: string): Promise<void> {
  await api.delete(`/leads/${leadId}`);
}
