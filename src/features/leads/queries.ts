"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createLead, deleteLead, getLead, getLeads, updateLead } from "./api";
import type { CreateLeadInput, ListLeadsFilter, UpdateLeadInput } from "./types";

export const leadsKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsKeys.all, "list"] as const,
  list: (filters?: ListLeadsFilter) => [...leadsKeys.lists(), filters] as const,
  details: () => [...leadsKeys.all, "detail"] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
};

export const leadsListQueryOptions = (filters?: ListLeadsFilter) =>
  queryOptions({
    queryKey: leadsKeys.list(filters),
    queryFn: ({ signal }) => getLeads(filters, signal),
    staleTime: 30 * 1000,
  });

export function useLeads(filters?: ListLeadsFilter) {
  return useQuery(leadsListQueryOptions(filters));
}

export function useLead(leadId: string) {
  return useQuery({
    queryKey: leadsKeys.detail(leadId),
    queryFn: ({ signal }) => getLead(leadId, signal),
    enabled: Boolean(leadId),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: UpdateLeadInput }) =>
      updateLead(leadId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(vars.leadId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}
