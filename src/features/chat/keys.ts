import type { ChatScope } from "./types";

export const chatKeys = {
  all: (scope: ChatScope, scopeId: string) => ["chat", scope, scopeId] as const,
  contacts: (scope: ChatScope, scopeId: string, q?: string) =>
    ["chat", scope, scopeId, "contacts", q ?? ""] as const,
  channels: (scope: ChatScope, scopeId: string, includeArchived = false) =>
    ["chat", scope, scopeId, "channels", { includeArchived }] as const,
  channel: (scope: ChatScope, scopeId: string, channelId: string) =>
    ["chat", scope, scopeId, "channel", channelId] as const,
  messages: (
    scope: ChatScope,
    scopeId: string,
    channelId: string,
    filters?: { q?: string; pinnedOnly?: boolean; parentMessageId?: string },
  ) => ["chat", scope, scopeId, "messages", channelId, filters ?? {}] as const,
};
