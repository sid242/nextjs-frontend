"use client";

import { create } from "zustand";

import { registerStoreReset } from "@/lib/stores/reset";

import type { ChatMessage, ChatScope } from "./types";

interface ChatStoreState {
  activeChannelByKey: Record<string, string | null>;
  drafts: Record<string, string>;
  replyToByChannel: Record<string, ChatMessage | null>;
  editingMessage: ChatMessage | null;
  typingByChannel: Record<string, Record<string, number>>;
  presenceOverrides: Record<string, boolean>;

  setActiveChannel: (scope: ChatScope, scopeId: string, channelId: string | null) => void;
  setDraft: (channelId: string, value: string) => void;
  setReplyTo: (channelId: string, msg: ChatMessage | null) => void;
  setEditingMessage: (msg: ChatMessage | null) => void;
  setActorTyping: (channelId: string, actorId: string, isTyping: boolean) => void;
  pruneExpiredTyping: (channelId: string) => void;
  setPresenceOverride: (scope: ChatScope, actorId: string, online: boolean) => void;
  reset: () => void;
}

const scopeStorageKey = (scope: ChatScope, scopeId: string) => `${scope}:${scopeId}`;

export const useChatStore = create<ChatStoreState>((set) => ({
  activeChannelByKey: {},
  drafts: {},
  replyToByChannel: {},
  editingMessage: null,
  typingByChannel: {},
  presenceOverrides: {},

  setActiveChannel: (scope, scopeId, channelId) =>
    set((s) => ({
      activeChannelByKey: { ...s.activeChannelByKey, [scopeStorageKey(scope, scopeId)]: channelId },
      editingMessage: null,
    })),

  setDraft: (channelId, value) =>
    set((s) => ({
      drafts: { ...s.drafts, [channelId]: value },
    })),

  setReplyTo: (channelId, msg) =>
    set((s) => ({
      replyToByChannel: { ...s.replyToByChannel, [channelId]: msg },
      editingMessage: null,
    })),

  setEditingMessage: (msg) => set({ editingMessage: msg }),

  setActorTyping: (channelId, actorId, isTyping) =>
    set((s) => {
      const current = { ...(s.typingByChannel[channelId] ?? {}) };
      if (isTyping) {
        current[actorId] = Date.now() + 4500;
      } else {
        delete current[actorId];
      }
      return {
        typingByChannel: { ...s.typingByChannel, [channelId]: current },
      };
    }),

  pruneExpiredTyping: (channelId) =>
    set((s) => {
      const current = s.typingByChannel[channelId];
      if (!current) return s;
      const now = Date.now();
      const next: Record<string, number> = {};
      let changed = false;
      for (const [actorId, expiresAt] of Object.entries(current)) {
        if (expiresAt > now) {
          next[actorId] = expiresAt;
        } else {
          changed = true;
        }
      }
      if (!changed) return s;
      return { typingByChannel: { ...s.typingByChannel, [channelId]: next } };
    }),

  setPresenceOverride: (scope, actorId, online) =>
    set((s) => ({
      presenceOverrides: { ...s.presenceOverrides, [`${scope}:${actorId}`]: online },
    })),

  reset: () =>
    set({
      activeChannelByKey: {},
      drafts: {},
      replyToByChannel: {},
      editingMessage: null,
      typingByChannel: {},
      presenceOverrides: {},
    }),
}));

registerStoreReset(() => {
  useChatStore.getState().reset();
});
