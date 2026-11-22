"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenantUrl } from "@/lib/tenancy";

import { createLead, deleteLead, getLead, getLeads, updateLead } from "./api";
import type { CreateLeadInput, ListLeadsFilter, UpdateLeadInput } from "./types";

export const leadsKeys = {
  all: ["leads"] as const,
  workspace: (slug: string) => [...leadsKeys.all, slug] as const,
  lists: (slug: string) => [...leadsKeys.workspace(slug), "list"] as const,
  list: (slug: string, filters?: ListLeadsFilter) => [...leadsKeys.lists(slug), filters] as const,
  details: (slug: string) => [...leadsKeys.workspace(slug), "detail"] as const,
  detail: (slug: string, id: string) => [...leadsKeys.details(slug), id] as const,
};

export const leadsListQueryOptions = (slug: string, filters?: ListLeadsFilter) =>
  queryOptions({
    queryKey: leadsKeys.list(slug, filters),
    enabled: Boolean(slug),
    queryFn: ({ signal }) => getLeads(filters, signal),
    staleTime: 30 * 1000,
  });

export function useLeads(filters?: ListLeadsFilter) {
  const slug = useTenantUrl()?.slug ?? "";
  return useQuery(leadsListQueryOptions(slug, filters));
}

export function useLead(leadId: string) {
  const slug = useTenantUrl()?.slug ?? "";
  return useQuery({
    queryKey: leadsKeys.detail(slug, leadId),
    queryFn: ({ signal }) => getLead(leadId, signal),
    enabled: Boolean(slug && leadId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.workspace(slug) });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: UpdateLeadInput }) =>
      updateLead(leadId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(slug, vars.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists(slug) });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const slug = useTenantUrl()?.slug ?? "";
  return useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.workspace(slug) });
    },
  });
}
