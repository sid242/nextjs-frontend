import { api } from "@/lib/api/http";

import type {
  AddTicketMessageInput,
  CreateFeedbackInput,
  CreateTicketInput,
  FeedbackItem,
  SupportTicket,
  SupportTicketMessage,
  TicketDetailsResponse,
  UpdateTicketInput,
} from "./types";

// ─── Tenant Support API ──────────────────────────────────────────────────────

export const listTenantTickets = (tenantId: string, status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return api.get<SupportTicket[]>(`/tenants/${tenantId}/support/tickets${query}`);
};

export const createTenantTicket = (tenantId: string, input: CreateTicketInput) =>
  api.post<SupportTicket>(`/tenants/${tenantId}/support/tickets`, input);

export const getTicketDetails = (tenantId: string, ticketId: string) =>
  api.get<TicketDetailsResponse>(`/tenants/${tenantId}/support/tickets/${ticketId}`);

export const addTicketMessage = (
  tenantId: string,
  ticketId: string,
  input: AddTicketMessageInput,
) =>
  api.post<SupportTicketMessage>(
    `/tenants/${tenantId}/support/tickets/${ticketId}/messages`,
    input,
  );

export const updateTenantTicket = (tenantId: string, ticketId: string, input: UpdateTicketInput) =>
  api.patch<SupportTicket>(`/tenants/${tenantId}/support/tickets/${ticketId}`, input);

// ─── Feedback API ────────────────────────────────────────────────────────────

export const submitFeedback = (input: CreateFeedbackInput) =>
  api.post<FeedbackItem>("/feedback", input);

// ─── Platform Support Queue API ──────────────────────────────────────────────

export const listPlatformTickets = (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return api.get<SupportTicket[]>(`/platform/support/tickets${query}`);
};

export const listPlatformFeedback = (limit = 50) =>
  api.get<FeedbackItem[]>(`/platform/support/feedback?limit=${limit}`);
