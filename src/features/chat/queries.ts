"use client";

import { useEffect, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useSocket, useSocketEvent } from "@/features/realtime";

import { createChatApi } from "./api";
import { chatKeys } from "./keys";
import { useChatStore } from "./store";
import type {
  ChatAttachment,
  ChatChannel,
  ChatChannelType,
  ChatMember,
  ChatMessage,
  ChatPaginatedMessages,
  ChatScope,
} from "./types";

export function useChatContacts(scope: ChatScope, scopeId: string, q?: string) {
  const chatApi = useMemo(() => createChatApi(scope), [scope]);
  return useQuery({
    queryKey: chatKeys.contacts(scope, scopeId, q),
    queryFn: ({ signal }) => chatApi.listContacts(q, signal),
    enabled: Boolean(scopeId),
    staleTime: 60_000,
  });
}

export function useChatChannels(
  scope: ChatScope,
  scopeId: string,
  opts?: { includeArchived?: boolean; type?: ChatChannelType; q?: string },
) {
  const chatApi = useMemo(() => createChatApi(scope), [scope]);
  const includeArchived = opts?.includeArchived ?? false;

  return useQuery({
    queryKey: chatKeys.channels(scope, scopeId, includeArchived),
    queryFn: ({ signal }) => chatApi.listChannels(opts, signal),
    enabled: Boolean(scopeId),
    staleTime: 15_000,
  });
}

export function useChatChannelDetails(scope: ChatScope, scopeId: string, channelId: string | null) {
  const chatApi = useMemo(() => createChatApi(scope), [scope]);
  return useQuery({
    queryKey: chatKeys.channel(scope, scopeId, channelId ?? ""),
    queryFn: ({ signal }) => chatApi.getChannelDetails(channelId!, signal),
    enabled: Boolean(scopeId && channelId),
    staleTime: 30_000,
  });
}

export function useChatMessages(
  scope: ChatScope,
  scopeId: string,
  channelId: string | null,
  filters?: { q?: string; pinnedOnly?: boolean; parentMessageId?: string },
) {
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useInfiniteQuery<
    ChatPaginatedMessages,
    Error,
    InfiniteData<ChatPaginatedMessages>,
    ReturnType<typeof chatKeys.messages>,
    string | undefined
  >({
    queryKey: chatKeys.messages(scope, scopeId, channelId ?? "", filters),
    initialPageParam: undefined,
    queryFn: ({ pageParam, signal }) =>
      chatApi.listMessages(
        channelId!,
        {
          before: pageParam,
          limit: 50,
          q: filters?.q || undefined,
          pinnedOnly: filters?.pinnedOnly || undefined,
          parentMessageId: filters?.parentMessageId || undefined,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: Boolean(scopeId && channelId),
  });
}

export function useCreateChannel(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: chatApi.createChannel,
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: chatKeys.all(scope, scopeId) });
      useChatStore.getState().setActiveChannel(scope, scopeId, created.id);
      toast.success(`Created #${created.name ?? "channel"}`);
    },
  });
}

export function useCreateDirectChannel(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: chatApi.createDirectChannel,
    onSuccess: (channel) => {
      void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
      useChatStore.getState().setActiveChannel(scope, scopeId, channel.id);
    },
  });
}

export function useUpdateChannel(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: {
        name?: string;
        description?: string | null;
        topic?: string | null;
        isArchived?: boolean;
      };
    }) => chatApi.updateChannel(channelId, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: chatKeys.all(scope, scopeId) });
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, vars.channelId) });
      toast.success("Channel updated");
    },
  });
}

export function useJoinChannel(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: chatApi.joinChannel,
    onSuccess: (channel) => {
      void qc.invalidateQueries({ queryKey: chatKeys.all(scope, scopeId) });
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, channel.id) });
      toast.success(`Joined #${channel.name ?? "channel"}`);
    },
  });
}

export function useLeaveChannel(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: chatApi.leaveChannel,
    onSuccess: (_res, channelId) => {
      const store = useChatStore.getState();
      if (store.activeChannelByKey[`${scope}:${scopeId}`] === channelId) {
        store.setActiveChannel(scope, scopeId, null);
      }
      void qc.invalidateQueries({ queryKey: chatKeys.all(scope, scopeId) });
      toast.success("Left channel");
    },
  });
}

export function useUpdateChannelPreferences(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: { isMuted?: boolean; isPinned?: boolean };
    }) => chatApi.updatePreferences(channelId, data),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, vars.channelId) });
    },
  });
}

export function useAddChannelMembers(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({ channelId, memberIds }: { channelId: string; memberIds: string[] }) =>
      chatApi.addMembers(channelId, memberIds),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, vars.channelId) });
      void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
      toast.success("Members added to channel");
    },
  });
}

export function useRemoveChannelMember(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({ channelId, memberId }: { channelId: string; memberId: string }) =>
      chatApi.removeMember(channelId, memberId),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, vars.channelId) });
      void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
      toast.success("Member removed");
    },
  });
}

export function useUpdateChannelMemberRole(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      memberId,
      role,
    }: {
      channelId: string;
      memberId: string;
      role: "ADMIN" | "MEMBER";
    }) => chatApi.updateMemberRole(channelId, memberId, role),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, vars.channelId) });
    },
  });
}

function appendMessageToCache(
  old: InfiniteData<ChatPaginatedMessages> | undefined,
  message: ChatMessage,
): InfiniteData<ChatPaginatedMessages> | undefined {
  if (!old || old.pages.length === 0) return old;
  const alreadyExists = old.pages.some((p) => p.items.some((m) => m.id === message.id));
  if (alreadyExists) return old;

  const firstPage = old.pages[0]!;
  return {
    ...old,
    pages: [{ ...firstPage, items: [...firstPage.items, message] }, ...old.pages.slice(1)],
  };
}

function replaceMessageInCache(
  old: InfiniteData<ChatPaginatedMessages> | undefined,
  updater: (msg: ChatMessage) => ChatMessage,
): InfiniteData<ChatPaginatedMessages> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((p) => ({
      ...p,
      items: p.items.map(updater),
    })),
  };
}

export function useSendMessage(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      body,
      parentMessageId,
      mentions,
      attachments,
    }: {
      channelId: string;
      body: string;
      parentMessageId?: string | null;
      mentions?: string[];
      attachments?: ChatAttachment[];
    }) =>
      chatApi.sendMessage(channelId, {
        body,
        parentMessageId,
        mentions,
        attachments,
      }),
    onSuccess: (created, vars) => {
      qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
        chatKeys.messages(scope, scopeId, vars.channelId),
        (old) => appendMessageToCache(old, created),
      );
      void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
    },
  });
}

export function useEditMessage(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      messageId,
      body,
      mentions,
    }: {
      channelId: string;
      messageId: string;
      body: string;
      mentions?: string[];
    }) => chatApi.editMessage(channelId, messageId, { body, mentions }),
    onSuccess: (updated, vars) => {
      qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
        chatKeys.messages(scope, scopeId, vars.channelId),
        (old) => replaceMessageInCache(old, (m) => (m.id === updated.id ? updated : m)),
      );
      useChatStore.getState().setEditingMessage(null);
    },
  });
}

export function useDeleteMessage(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      chatApi.deleteMessage(channelId, messageId),
    onSuccess: (res, vars) => {
      qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
        chatKeys.messages(scope, scopeId, vars.channelId),
        (old) =>
          replaceMessageInCache(old, (m) =>
            m.id === res.id
              ? { ...m, body: "", attachments: [], reactions: [], deletedAt: res.deletedAt }
              : m,
          ),
      );
    },
  });
}

export function useTogglePinMessage(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      chatApi.togglePinMessage(channelId, messageId),
    onSuccess: (updated, vars) => {
      qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
        chatKeys.messages(scope, scopeId, vars.channelId),
        (old) => replaceMessageInCache(old, (m) => (m.id === updated.id ? updated : m)),
      );
      toast.success(updated.isPinned ? "Message pinned" : "Message unpinned");
    },
  });
}

export function useToggleReaction(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      messageId,
      emoji,
    }: {
      channelId: string;
      messageId: string;
      emoji: string;
    }) => chatApi.toggleReaction(channelId, messageId, emoji),
    onSuccess: (res, vars) => {
      qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
        chatKeys.messages(scope, scopeId, vars.channelId),
        (old) =>
          replaceMessageInCache(old, (m) =>
            m.id === vars.messageId ? { ...m, reactions: res.reactions } : m,
          ),
      );
    },
  });
}

export function useMarkChannelRead(scope: ChatScope, scopeId: string) {
  const qc = useQueryClient();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  return useMutation({
    mutationFn: ({
      channelId,
      lastReadMessageId,
    }: {
      channelId: string;
      lastReadMessageId?: string;
    }) => chatApi.markRead(channelId, lastReadMessageId),
    meta: { silent: true },
    onSuccess: (res) => {
      qc.setQueryData<ChatChannel[]>(chatKeys.channels(scope, scopeId, false), (old) =>
        old?.map((c) =>
          c.id === res.channelId
            ? {
                ...c,
                unreadCount: 0,
                lastReadMessageId: res.lastReadMessageId ?? c.lastReadMessageId,
              }
            : c,
        ),
      );
    },
  });
}

/**
 * Joins the active channel's Socket.IO room and synchronizes incoming chat events into React Query & Zustand.
 */
export function useChatRealtimeSync(
  scope: ChatScope,
  scopeId: string,
  activeChannelId: string | null,
  currentActorId?: string,
) {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !activeChannelId) return;
    socket.emit("chat:join", { channelId: activeChannelId });
    return () => {
      socket.emit("chat:leave", { channelId: activeChannelId });
    };
  }, [socket, activeChannelId]);

  useEffect(() => {
    if (!activeChannelId) return;
    const interval = setInterval(() => {
      useChatStore.getState().pruneExpiredTyping(activeChannelId);
    }, 1500);
    return () => clearInterval(interval);
  }, [activeChannelId]);

  useSocketEvent("chat:message:created", (payload) => {
    if (payload.scope !== scope) return;
    const msg = payload.message as unknown as ChatMessage;
    qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
      chatKeys.messages(scope, scopeId, payload.channelId),
      (old) => appendMessageToCache(old, msg),
    );
    if (msg.senderId !== currentActorId) {
      useChatStore.getState().setActorTyping(payload.channelId, msg.senderId, false);
    }
    void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
  });

  useSocketEvent("chat:message:updated", (payload) => {
    if (payload.scope !== scope) return;
    const updated = payload.message as unknown as ChatMessage;
    qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
      chatKeys.messages(scope, scopeId, payload.channelId),
      (old) => replaceMessageInCache(old, (m) => (m.id === updated.id ? updated : m)),
    );
  });

  useSocketEvent("chat:message:deleted", (payload) => {
    if (payload.scope !== scope) return;
    qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
      chatKeys.messages(scope, scopeId, payload.channelId),
      (old) =>
        replaceMessageInCache(old, (m) =>
          m.id === payload.messageId
            ? { ...m, body: "", attachments: [], reactions: [], deletedAt: payload.deletedAt }
            : m,
        ),
    );
  });

  useSocketEvent("chat:reaction:updated", (payload) => {
    if (payload.scope !== scope) return;
    const mapped = payload.reactions.map((r) => ({
      ...r,
      reactedByMe: currentActorId ? r.actorIds.includes(currentActorId) : false,
    }));
    qc.setQueryData<InfiniteData<ChatPaginatedMessages>>(
      chatKeys.messages(scope, scopeId, payload.channelId),
      (old) =>
        replaceMessageInCache(old, (m) =>
          m.id === payload.messageId ? { ...m, reactions: mapped } : m,
        ),
    );
  });

  useSocketEvent("chat:channel:updated", (payload) => {
    if (payload.scope !== scope) return;
    void qc.invalidateQueries({ queryKey: chatKeys.channels(scope, scopeId, false) });
    if (payload.channelId === activeChannelId) {
      void qc.invalidateQueries({ queryKey: chatKeys.channel(scope, scopeId, payload.channelId) });
    }
  });

  useSocketEvent("chat:typing", (payload) => {
    if (payload.scope !== scope || payload.actorId === currentActorId) return;
    useChatStore.getState().setActorTyping(payload.channelId, payload.actorId, payload.isTyping);
  });

  useSocketEvent("chat:presence", (payload) => {
    if (payload.scope !== scope) return;
    useChatStore.getState().setPresenceOverride(scope, payload.actorId, payload.online);
  });

  useSocketEvent("chat:read", (payload) => {
    if (payload.scope !== scope) return;
    if (payload.actorId === currentActorId) {
      qc.setQueryData<ChatChannel[]>(chatKeys.channels(scope, scopeId, false), (old) =>
        old?.map((c) =>
          c.id === payload.channelId
            ? {
                ...c,
                unreadCount: 0,
                lastReadMessageId: payload.lastReadMessageId ?? c.lastReadMessageId,
              }
            : c,
        ),
      );
    }

    qc.setQueryData<{ channel: ChatChannel; members: ChatMember[] }>(
      chatKeys.channel(scope, scopeId, payload.channelId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          members: old.members.map((m) => {
            if (m.actorId !== payload.actorId) return m;
            if (
              m.lastReadAt &&
              payload.lastReadAt &&
              new Date(payload.lastReadAt).getTime() < new Date(m.lastReadAt).getTime()
            ) {
              return m;
            }
            return {
              ...m,
              unreadCount: 0,
              lastReadAt: payload.lastReadAt ?? m.lastReadAt,
              lastReadMessageId: payload.lastReadMessageId ?? m.lastReadMessageId,
            };
          }),
        };
      },
    );
  });
}
