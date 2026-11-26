import { api } from "@/lib/api/http";

import type {
  WhatsAppAccount,
  WhatsAppCampaign,
  WhatsAppContact,
  WhatsAppContactConsent,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppPhoneNumber,
  WhatsAppTemplate,
  WhatsAppUsageRecord,
  WhatsAppUsageSummary,
} from "./types";

export const getWhatsAppAccount = (signal?: AbortSignal) =>
  api.get<WhatsAppAccount | null>("/tenant/whatsapp/accounts", { signal });

export const createOnboardingSession = () =>
  api.post<{ state: string; appId?: string; configId?: string; graphVersion: string }>(
    "/tenant/whatsapp/onboarding/session",
    {},
  );

export const completeOnboarding = (data: {
  state: string;
  code?: string;
  accessToken?: string;
  wabaId: string;
  displayName?: string;
}) =>
  api.post<{ accountId: string; wabaId: string; phoneNumbersCount: number }>(
    "/tenant/whatsapp/onboarding/complete",
    data,
  );

export const disconnectWhatsAppAccount = (accountId: string) =>
  api.delete<{ success: boolean }>(`/tenant/whatsapp/accounts/${accountId}`);

export const refreshWhatsAppAccount = () =>
  api.post<{ success: boolean; count: number }>("/tenant/whatsapp/accounts/refresh", {});

export const getWhatsAppPhoneNumbers = (signal?: AbortSignal) =>
  api.get<WhatsAppPhoneNumber[]>("/tenant/whatsapp/phone-numbers", { signal });

export const updateWhatsAppPhoneNumber = (
  id: string,
  data: { isEnabled?: boolean; isDefault?: boolean },
) => api.patch<WhatsAppPhoneNumber[]>(`/tenant/whatsapp/phone-numbers/${id}`, data);

export const getWhatsAppTemplates = (
  params?: { category?: string; status?: string; search?: string },
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return api.get<{ items: WhatsAppTemplate[]; total: number }>(
    `/tenant/whatsapp/templates${qs ? `?${qs}` : ""}`,
    { signal },
  );
};

export const getWhatsAppTemplate = (id: string, signal?: AbortSignal) =>
  api.get<WhatsAppTemplate>(`/tenant/whatsapp/templates/${id}`, { signal });

export const createWhatsAppTemplate = (data: {
  name: string;
  category: string;
  language?: string;
  components: Record<string, unknown>[];
}) => api.post<WhatsAppTemplate>("/tenant/whatsapp/templates", data);

export const submitWhatsAppTemplate = (id: string) =>
  api.post<WhatsAppTemplate>(`/tenant/whatsapp/templates/${id}/submit`, {});

export const syncWhatsAppTemplates = () =>
  api.post<{ success: boolean; count: number }>("/tenant/whatsapp/templates/sync", {});

export const deleteWhatsAppTemplate = (id: string) =>
  api.delete<{ success: boolean }>(`/tenant/whatsapp/templates/${id}`);

export const sendWhatsAppTemplateMessage = (data: {
  phoneNumberId?: string;
  to: string;
  template: {
    name: string;
    language?: string;
    components?: unknown[];
  };
}) => api.post<WhatsAppMessage>("/tenant/whatsapp/messages/template", data);

export const sendWhatsAppTextMessage = (data: {
  phoneNumberId?: string;
  to: string;
  text: string;
}) => api.post<WhatsAppMessage>("/tenant/whatsapp/messages/text", data);

export const getWhatsAppMessages = (
  params?: { conversationId?: string; contactId?: string; limit?: number },
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams();
  if (params?.conversationId) query.set("conversationId", params.conversationId);
  if (params?.contactId) query.set("contactId", params.contactId);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return api.get<WhatsAppMessage[]>(`/tenant/whatsapp/messages${qs ? `?${qs}` : ""}`, { signal });
};

export const getWhatsAppConversations = (status?: string, signal?: AbortSignal) => {
  const qs = status ? `?status=${status}` : "";
  return api.get<WhatsAppConversation[]>(`/tenant/whatsapp/conversations${qs}`, { signal });
};

export const getWhatsAppConversationMessages = (conversationId: string, signal?: AbortSignal) =>
  api.get<WhatsAppMessage[]>(`/tenant/whatsapp/conversations/${conversationId}/messages`, {
    signal,
  });

export const replyToWhatsAppConversation = (conversationId: string, text: string) =>
  api.post<WhatsAppMessage>(`/tenant/whatsapp/conversations/${conversationId}/reply`, { text });

export const assignWhatsAppConversation = (conversationId: string, staffId: string | null) =>
  api.patch<WhatsAppConversation>(`/tenant/whatsapp/conversations/${conversationId}/assignment`, {
    staffId,
  });

export const getWhatsAppCampaigns = (signal?: AbortSignal) =>
  api.get<WhatsAppCampaign[]>("/tenant/whatsapp/campaigns", { signal });

export const createWhatsAppCampaign = (data: {
  name: string;
  templateId: string;
  phoneNumberId?: string;
  recipients: Array<{ phoneNumber: string; displayName?: string }>;
}) => api.post<WhatsAppCampaign>("/tenant/whatsapp/campaigns", data);

export const scheduleWhatsAppCampaign = (id: string, scheduledAt?: string) =>
  api.post<WhatsAppCampaign>(`/tenant/whatsapp/campaigns/${id}/schedule`, { scheduledAt });

export const cancelWhatsAppCampaign = (id: string) =>
  api.post<WhatsAppCampaign>(`/tenant/whatsapp/campaigns/${id}/cancel`, {});

export const getWhatsAppContacts = (search?: string, signal?: AbortSignal) => {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get<WhatsAppContact[]>(`/tenant/whatsapp/contacts${qs}`, { signal });
};

export const updateWhatsAppContactConsent = (
  contactId: string,
  data: { purpose: string; status: "OPTED_IN" | "OPTED_OUT" },
) => api.patch<WhatsAppContactConsent>(`/tenant/whatsapp/contacts/${contactId}/consent`, data);

export const getWhatsAppUsageSummary = (signal?: AbortSignal) =>
  api.get<WhatsAppUsageSummary>("/tenant/whatsapp/usage/summary", { signal });

export const getWhatsAppUsageMessages = (limit = 50, signal?: AbortSignal) =>
  api.get<WhatsAppUsageRecord[]>(`/tenant/whatsapp/usage/messages?limit=${limit}`, { signal });
