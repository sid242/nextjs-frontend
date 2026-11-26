import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import { whatsappKeys } from "./keys";

export const whatsAppAccountQueryOptions = () =>
  queryOptions({
    queryKey: whatsappKeys.account(),
    queryFn: ({ signal }) => api.getWhatsAppAccount(signal),
  });

export const whatsAppPhoneNumbersQueryOptions = () =>
  queryOptions({
    queryKey: whatsappKeys.phoneNumbers(),
    queryFn: ({ signal }) => api.getWhatsAppPhoneNumbers(signal),
  });

export const whatsAppTemplatesQueryOptions = (params?: {
  category?: string;
  status?: string;
  search?: string;
}) =>
  queryOptions({
    queryKey: whatsappKeys.templates(params),
    queryFn: ({ signal }) => api.getWhatsAppTemplates(params, signal),
  });

export const whatsAppTemplateQueryOptions = (id: string) =>
  queryOptions({
    queryKey: whatsappKeys.template(id),
    queryFn: ({ signal }) => api.getWhatsAppTemplate(id, signal),
    enabled: Boolean(id),
  });

export const whatsAppConversationsQueryOptions = (status?: string) =>
  queryOptions({
    queryKey: whatsappKeys.conversations(status),
    queryFn: ({ signal }) => api.getWhatsAppConversations(status, signal),
    refetchInterval: 10_000,
  });

export const whatsAppConversationMessagesQueryOptions = (conversationId?: string) =>
  queryOptions({
    queryKey: whatsappKeys.conversationMessages(conversationId || ""),
    queryFn: ({ signal }) =>
      conversationId
        ? api.getWhatsAppConversationMessages(conversationId, signal)
        : Promise.resolve([]),
    enabled: Boolean(conversationId),
    refetchInterval: 5_000,
  });

export const whatsAppMessagesQueryOptions = (filters?: { limit?: number }) =>
  queryOptions({
    queryKey: whatsappKeys.messages(filters),
    queryFn: ({ signal }) => api.getWhatsAppMessages(filters, signal),
  });

export const whatsAppCampaignsQueryOptions = () =>
  queryOptions({
    queryKey: whatsappKeys.campaigns(),
    queryFn: ({ signal }) => api.getWhatsAppCampaigns(signal),
  });

export const whatsAppContactsQueryOptions = (search?: string) =>
  queryOptions({
    queryKey: whatsappKeys.contacts(search),
    queryFn: ({ signal }) => api.getWhatsAppContacts(search, signal),
  });

export const whatsAppUsageSummaryQueryOptions = () =>
  queryOptions({
    queryKey: whatsappKeys.usageSummary(),
    queryFn: ({ signal }) => api.getWhatsAppUsageSummary(signal),
  });

export const whatsAppUsageMessagesQueryOptions = (limit = 50) =>
  queryOptions({
    queryKey: whatsappKeys.usageMessages(limit),
    queryFn: ({ signal }) => api.getWhatsAppUsageMessages(limit, signal),
  });

// --- Mutation Hooks ---

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.account() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.phoneNumbers() });
    },
  });
}

export function useDisconnectAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.disconnectWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    },
  });
}

export function useUpdatePhoneNumberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { isEnabled?: boolean; isDefault?: boolean };
    }) => api.updateWhatsAppPhoneNumber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.phoneNumbers() });
    },
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWhatsAppTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.templates() });
    },
  });
}

export function useSubmitTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitWhatsAppTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.templates() });
    },
  });
}

export function useSyncTemplatesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.syncWhatsAppTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.templates() });
    },
  });
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWhatsAppTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.templates() });
    },
  });
}

export function useSendTemplateMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.sendWhatsAppTemplateMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.usageSummary() });
    },
  });
}

export function useSendTextMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.sendWhatsAppTextMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.conversations() });
    },
  });
}

export function useReplyConversationMutation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.replyToWhatsAppConversation(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationMessages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.conversations() });
    },
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWhatsAppCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
    },
  });
}

export function useScheduleCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt?: string }) =>
      api.scheduleWhatsAppCampaign(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
    },
  });
}

export function useCancelCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelWhatsAppCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
    },
  });
}

export function useUpdateConsentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: { purpose: string; status: "OPTED_IN" | "OPTED_OUT" };
    }) => api.updateWhatsAppContactConsent(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts() });
    },
  });
}
