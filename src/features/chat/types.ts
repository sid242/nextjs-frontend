export type ChatScope = "tenant" | "platform";

export type ChatChannelType = "DIRECT" | "GROUP" | "PUBLIC" | "PRIVATE";
export type ChatParticipantRole = "OWNER" | "ADMIN" | "MEMBER";
export type ChatMessageType = "TEXT" | "SYSTEM";

export interface ChatParticipantProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  roleLabel: string | null;
  isOnline: boolean;
}

export interface ChatMember {
  id: string;
  channelId: string;
  actorId: string;
  role: ChatParticipantRole;
  isMuted: boolean;
  isPinned: boolean;
  lastReadAt: string | null;
  lastReadMessageId: string | null;
  unreadCount: number;
  joinedAt: string;
  profile: ChatParticipantProfile;
}

export interface ChatChannel {
  id: string;
  scope: ChatScope;
  tenantId: string | null;
  type: ChatChannelType;
  name: string | null;
  slug: string | null;
  description: string | null;
  topic: string | null;
  directKey: string | null;
  createdByActorId: string;
  isArchived: boolean;
  archivedAt: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  messageCount: number;
  memberCount: number;
  isMember: boolean;
  myRole: ChatParticipantRole | null;
  isMuted: boolean;
  isPinned: boolean;
  unreadCount: number;
  lastReadMessageId: string | null;
  peer: ChatParticipantProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ChatReactionSummary {
  emoji: string;
  count: number;
  actorIds: string[];
  reactedByMe: boolean;
}

export interface ChatMessageParentPreview {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  deletedAt: string | null;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  sender: ChatParticipantProfile;
  type: ChatMessageType;
  body: string;
  parentMessageId: string | null;
  parentMessage: ChatMessageParentPreview | null;
  replyCount: number;
  mentions: string[];
  attachments: ChatAttachment[];
  reactions: ChatReactionSummary[];
  isPinned: boolean;
  pinnedByActorId: string | null;
  pinnedAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPaginatedMessages {
  items: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PresignedChatAttachment {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadUrl: string;
  fields: Record<string, string>;
}
