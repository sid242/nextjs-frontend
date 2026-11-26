import type { Socket } from "socket.io-client";

export interface ChatRealtimeReactionSummary {
  emoji: string;
  count: number;
  actorIds: string[];
  reactedByMe: boolean;
}

export interface ChatRealtimeMessagePayload {
  scope: "tenant" | "platform";
  channelId: string;
  message: {
    id: string;
    channelId: string;
    senderId: string;
    sender: {
      id: string;
      displayName: string;
      email: string;
      avatarUrl: string | null;
      roleLabel: string | null;
      isOnline: boolean;
    };
    type: "TEXT" | "SYSTEM";
    body: string;
    parentMessageId: string | null;
    parentMessage: {
      id: string;
      senderId: string;
      senderName: string;
      body: string;
      deletedAt: string | null;
    } | null;
    replyCount: number;
    mentions: string[];
    attachments: Array<{
      id: string;
      key: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }>;
    reactions: ChatRealtimeReactionSummary[];
    isPinned: boolean;
    pinnedByActorId: string | null;
    pinnedAt: string | null;
    editedAt: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Typed Socket.IO contract: keep in sync with the backend (src/sockets/index.ts and emitters).
 * Add an event here first and every emit()/on() call site is type-checked.
 */
export interface ServerToClientEvents {
  /** Emitted by the file worker when background processing finishes. */
  "file:processed": (payload: {
    fileId: string;
    tenantId: string;
    scanStatus: "CLEAN" | "INFECTED" | "FAILED";
  }) => void;
  "room:message": (payload: { roomId: string; text: string; from: string; at: number }) => void;
  /** Emitted by notification service when new notification is dispatched. */
  "notification:new": (payload: {
    id: string;
    type: string;
    category?: string;
    severity?: string;
    title: string;
    body: string;
    link?: string | null;
    createdAt: string;
  }) => void;
  "chat:message:created": (payload: ChatRealtimeMessagePayload) => void;
  "chat:message:updated": (payload: ChatRealtimeMessagePayload) => void;
  "chat:message:deleted": (payload: {
    scope: "tenant" | "platform";
    channelId: string;
    messageId: string;
    deletedAt: string;
  }) => void;
  "chat:reaction:updated": (payload: {
    scope: "tenant" | "platform";
    channelId: string;
    messageId: string;
    reactions: ChatRealtimeReactionSummary[];
  }) => void;
  "chat:channel:updated": (payload: {
    scope: "tenant" | "platform";
    channelId: string;
    lastMessageAt?: string;
    lastMessagePreview?: string;
    lastMessageSenderId?: string;
    removed?: boolean;
  }) => void;
  "chat:read": (payload: {
    scope: "tenant" | "platform";
    channelId: string;
    actorId: string;
    lastReadMessageId: string | null;
    lastReadAt: string | null;
  }) => void;
  "chat:typing": (payload: {
    scope: "tenant" | "platform";
    channelId: string;
    actorId: string;
    isTyping: boolean;
  }) => void;
  "chat:presence": (payload: {
    scope: "tenant" | "platform";
    actorId: string;
    online: boolean;
  }) => void;
  "whatsapp:message:received": (payload: {
    conversationId: string;
    messageId?: string;
    phoneNumberId?: string;
    direction?: string;
    messageType?: string;
    createdAt?: string;
    unreadCount?: number;
    contact?: { id: string; name?: string; phoneNumber?: string };
  }) => void;
  "whatsapp:status:updated": (payload: {
    messageId: string;
    providerMessageId?: string;
    status: string;
  }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string }, ack?: (response: { ok: boolean }) => void) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "room:message": (payload: { roomId: string; text: string }) => void;
  "chat:join": (
    payload: { channelId: string },
    ack?: (response: { ok: boolean; error?: string }) => void,
  ) => void;
  "chat:leave": (payload: { channelId: string }, ack?: (response: { ok: boolean }) => void) => void;
  "chat:typing": (
    payload: { channelId: string; isTyping: boolean },
    ack?: (response: { ok: boolean }) => void,
  ) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
