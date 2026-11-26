export const whatsappKeys = {
  all: ["whatsapp"] as const,
  account: () => [...whatsappKeys.all, "account"] as const,
  phoneNumbers: () => [...whatsappKeys.all, "phone-numbers"] as const,
  templates: (filters?: Record<string, unknown>) =>
    [...whatsappKeys.all, "templates", filters] as const,
  template: (id: string) => [...whatsappKeys.all, "template", id] as const,
  messages: (filters?: Record<string, unknown>) =>
    [...whatsappKeys.all, "messages", filters] as const,
  conversations: (status?: string) => [...whatsappKeys.all, "conversations", status] as const,
  conversationMessages: (id: string) => [...whatsappKeys.all, "conversation-messages", id] as const,
  campaigns: () => [...whatsappKeys.all, "campaigns"] as const,
  campaign: (id: string) => [...whatsappKeys.all, "campaign", id] as const,
  contacts: (search?: string) => [...whatsappKeys.all, "contacts", search] as const,
  usageSummary: () => [...whatsappKeys.all, "usage-summary"] as const,
  usageMessages: (limit?: number) => [...whatsappKeys.all, "usage-messages", limit] as const,
};
