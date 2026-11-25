import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type {
  ChatAttachment,
  ChatChannel,
  ChatChannelType,
  ChatMember,
  ChatMessage,
  ChatPaginatedMessages,
  ChatParticipantProfile,
  ChatReactionSummary,
  ChatScope,
  PresignedChatAttachment,
} from "./types";

const basePath = (scope: ChatScope) => (scope === "platform" ? "/platform/chat" : "/chat");

export function createChatApi(scope: ChatScope) {
  const prefix = basePath(scope);

  return {
    listContacts: (q?: string, signal?: AbortSignal) =>
      api.get<ChatParticipantProfile[]>(`${prefix}/contacts${buildQueryString({ q })}`, {
        signal,
      }),

    listChannels: (
      params?: { includeArchived?: boolean; type?: ChatChannelType; q?: string },
      signal?: AbortSignal,
    ) => api.get<ChatChannel[]>(`${prefix}/channels${buildQueryString(params ?? {})}`, { signal }),

    getChannelDetails: (channelId: string, signal?: AbortSignal) =>
      api.get<{ channel: ChatChannel; members: ChatMember[] }>(`${prefix}/channels/${channelId}`, {
        signal,
      }),

    createChannel: (data: {
      type: "PUBLIC" | "PRIVATE" | "GROUP";
      name: string;
      description?: string | null;
      topic?: string | null;
      memberIds?: string[];
    }) => api.post<ChatChannel>(`${prefix}/channels`, data),

    createDirectChannel: (targetActorId: string) =>
      api.post<ChatChannel>(`${prefix}/channels/direct`, { targetActorId }),

    updateChannel: (
      channelId: string,
      data: {
        name?: string;
        description?: string | null;
        topic?: string | null;
        isArchived?: boolean;
      },
    ) => api.patch<ChatChannel>(`${prefix}/channels/${channelId}`, data),

    joinChannel: (channelId: string) =>
      api.post<ChatChannel>(`${prefix}/channels/${channelId}/join`),

    leaveChannel: (channelId: string) =>
      api.post<{ left: true }>(`${prefix}/channels/${channelId}/leave`),

    updatePreferences: (channelId: string, data: { isMuted?: boolean; isPinned?: boolean }) =>
      api.patch<ChatChannel>(`${prefix}/channels/${channelId}/preferences`, data),

    addMembers: (channelId: string, memberIds: string[]) =>
      api.post<ChatMember[]>(`${prefix}/channels/${channelId}/members`, { memberIds }),

    updateMemberRole: (channelId: string, memberId: string, role: "ADMIN" | "MEMBER") =>
      api.patch<ChatMember>(`${prefix}/channels/${channelId}/members/${memberId}`, { role }),

    removeMember: (channelId: string, memberId: string) =>
      api.delete<{ removed: true }>(`${prefix}/channels/${channelId}/members/${memberId}`),

    listMessages: (
      channelId: string,
      params?: {
        before?: string;
        after?: string;
        parentMessageId?: string;
        q?: string;
        pinnedOnly?: boolean;
        limit?: number;
      },
      signal?: AbortSignal,
    ) =>
      api.get<ChatPaginatedMessages>(
        `${prefix}/channels/${channelId}/messages${buildQueryString(params ?? {})}`,
        { signal },
      ),

    sendMessage: (
      channelId: string,
      data: {
        body: string;
        parentMessageId?: string | null;
        mentions?: string[];
        attachments?: ChatAttachment[];
      },
    ) => api.post<ChatMessage>(`${prefix}/channels/${channelId}/messages`, data),

    editMessage: (
      channelId: string,
      messageId: string,
      data: { body: string; mentions?: string[] },
    ) => api.patch<ChatMessage>(`${prefix}/channels/${channelId}/messages/${messageId}`, data),

    deleteMessage: (channelId: string, messageId: string) =>
      api.delete<{ id: string; deletedAt: string }>(
        `${prefix}/channels/${channelId}/messages/${messageId}`,
      ),

    togglePinMessage: (channelId: string, messageId: string) =>
      api.post<ChatMessage>(`${prefix}/channels/${channelId}/messages/${messageId}/pin`),

    toggleReaction: (channelId: string, messageId: string, emoji: string) =>
      api.post<{ added: boolean; reactions: ChatReactionSummary[] }>(
        `${prefix}/channels/${channelId}/messages/${messageId}/reactions`,
        { emoji },
      ),

    markRead: (channelId: string, lastReadMessageId?: string) =>
      api.post<{
        channelId: string;
        unreadCount: number;
        lastReadAt: string | null;
        lastReadMessageId: string | null;
      }>(`${prefix}/channels/${channelId}/read`, { lastReadMessageId }),

    presignAttachment: (data: {
      channelId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }) => api.post<PresignedChatAttachment>(`${prefix}/attachments/presign`, data),

    getAttachmentDownloadUrl: (params: {
      channelId: string;
      key: string;
      filename?: string;
      disposition?: "inline" | "attachment";
    }) =>
      api.get<{ downloadUrl: string }>(`${prefix}/attachments/download${buildQueryString(params)}`),
  };
}

export function uploadChatAttachmentToS3(
  presigned: PresignedChatAttachment,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", presigned.uploadUrl);

    if (onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          id: presigned.id,
          key: presigned.key,
          filename: presigned.filename,
          mimeType: presigned.mimeType,
          sizeBytes: presigned.sizeBytes,
        });
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}
