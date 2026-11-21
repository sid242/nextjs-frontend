"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import type {
  AddTicketMessageInput,
  CreateFeedbackInput,
  CreateTicketInput,
  SupportTicket,
  UpdateTicketInput,
} from "./types";

export const supportKeys = {
  all: ["support"] as const,
  tickets: (tenantId: string, status?: string) =>
    [...supportKeys.all, "tickets", tenantId, status ?? "all"] as const,
  ticketDetails: (tenantId: string, ticketId: string) =>
    [...supportKeys.all, "ticket", tenantId, ticketId] as const,
  platformTickets: (status?: string) =>
    [...supportKeys.all, "platform", "tickets", status ?? "all"] as const,
  platformFeedback: () => [...supportKeys.all, "platform", "feedback"] as const,
};

export function useTenantTickets(tenantId?: string | null, status?: string) {
  return useQuery({
    queryKey: supportKeys.tickets(tenantId ?? "", status),
    queryFn: () =>
      tenantId ? api.listTenantTickets(tenantId, status) : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useTicketDetails(tenantId?: string | null, ticketId?: string | null) {
  return useQuery({
    queryKey: supportKeys.ticketDetails(tenantId ?? "", ticketId ?? ""),
    queryFn: () =>
      tenantId && ticketId
        ? api.getTicketDetails(tenantId, ticketId)
        : Promise.reject(new Error("Missing params")),
    enabled: Boolean(tenantId && ticketId),
    refetchInterval: 5000, // poll for new messages while viewing ticket
  });
}

export function useCreateTicket(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTicketInput) => {
      if (!tenantId) throw new Error("Missing active tenant");
      return api.createTenantTicket(tenantId, input);
    },
    onSuccess: (newTicket: SupportTicket) => {
      if (!tenantId) return;
      queryClient.setQueryData<SupportTicket[]>(supportKeys.tickets(tenantId), (old) =>
        old ? [newTicket, ...old] : [newTicket],
      );
    },
  });
}

export function useAddTicketMessage(tenantId?: string | null, ticketId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddTicketMessageInput) => {
      if (!tenantId || !ticketId) throw new Error("Missing params");
      return api.addTicketMessage(tenantId, ticketId, input);
    },
    onSuccess: () => {
      if (!tenantId || !ticketId) return;
      queryClient.invalidateQueries({
        queryKey: supportKeys.ticketDetails(tenantId, ticketId),
      });
    },
  });
}

export function useUpdateTicket(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, input }: { ticketId: string; input: UpdateTicketInput }) => {
      if (!tenantId) throw new Error("Missing tenantId");
      return api.updateTenantTicket(tenantId, ticketId, input);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets(tenantId) });
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (input: CreateFeedbackInput) => api.submitFeedback(input),
  });
}

export function usePlatformTickets(status?: string) {
  return useQuery({
    queryKey: supportKeys.platformTickets(status),
    queryFn: () => api.listPlatformTickets(status),
    staleTime: 30 * 1000,
  });
}

export function usePlatformFeedback(limit = 50) {
  return useQuery({
    queryKey: supportKeys.platformFeedback(),
    queryFn: () => api.listPlatformFeedback(limit),
    staleTime: 60 * 1000,
  });
}
