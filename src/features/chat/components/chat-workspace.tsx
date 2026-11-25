"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  ArrowLeftIcon,
  BellIcon,
  BellOffIcon,
  HashIcon,
  LockIcon,
  MessageSquareIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { EmptyState } from "@/components/molecules/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  useChatChannelDetails,
  useChatChannels,
  useChatContacts,
  useChatMessages,
  useChatRealtimeSync,
  useDeleteMessage,
  useEditMessage,
  useJoinChannel,
  useMarkChannelRead,
  useSendMessage,
  useTogglePinMessage,
  useToggleReaction,
  useUpdateChannelPreferences,
} from "../queries";
import { useChatStore } from "../store";
import type { ChatChannel, ChatMessage, ChatScope } from "../types";
import { computeSeenByMap, formatMessageDateLabel } from "../utils";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { ChatComposer } from "./chat-composer";
import { ChatMessageItem } from "./chat-message-item";
import { ChatSidebar } from "./chat-sidebar";
import { NewChatDialog } from "./new-chat-dialog";

interface ChatWorkspaceProps {
  scope: ChatScope;
  scopeId: string;
  currentActorId?: string;
  canWrite: boolean;
  canManage: boolean;
  initialChannelId?: string | null;
}

export function ChatWorkspace({
  scope,
  scopeId,
  currentActorId,
  canWrite,
  canManage,
  initialChannelId,
}: ChatWorkspaceProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [mobileShowFeed, setMobileShowFeed] = useState(Boolean(initialChannelId));

  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const storeKey = `${scope}:${scopeId}`;

  const activeChannelId = useChatStore((s) => s.activeChannelByKey[storeKey] ?? null);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const setEditingMessage = useChatStore((s) => s.setEditingMessage);
  const typingMap = useChatStore((s) =>
    activeChannelId ? s.typingByChannel[activeChannelId] : undefined,
  );
  const presenceOverrides = useChatStore((s) => s.presenceOverrides);

  const { data: channels = [], isLoading: channelsLoading } = useChatChannels(scope, scopeId, {
    includeArchived: showArchived,
  });
  const { data: contacts = [] } = useChatContacts(scope, scopeId);

  // Respect optional ?channel= query param or auto-select first channel
  useEffect(() => {
    if (initialChannelId && channels.some((c) => c.id === initialChannelId)) {
      setActiveChannel(scope, scopeId, initialChannelId);
      return;
    }
    if (!activeChannelId && channels.length > 0) {
      setActiveChannel(scope, scopeId, channels[0]!.id);
    }
  }, [initialChannelId, channels, activeChannelId, scope, scopeId, setActiveChannel]);

  const activeChannel: ChatChannel | undefined = useMemo(
    () => channels.find((c) => c.id === activeChannelId),
    [channels, activeChannelId],
  );

  const { data: channelDetails } = useChatChannelDetails(scope, scopeId, activeChannelId);
  const channelMembers = useMemo(() => channelDetails?.members ?? [], [channelDetails?.members]);

  const msgFilters = useMemo(
    () => ({
      q: messageSearch.trim() || undefined,
      pinnedOnly: pinnedOnly || undefined,
    }),
    [messageSearch, pinnedOnly],
  );

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(scope, scopeId, activeChannelId, msgFilters);

  const messages: ChatMessage[] = useMemo(() => {
    if (!messagesData?.pages) return [];
    // Pages[0] is newest window; pages[1..] are older windows fetched via `before` cursor.
    return [...messagesData.pages].reverse().flatMap((p) => p.items);
  }, [messagesData]);

  useChatRealtimeSync(scope, scopeId, activeChannelId, currentActorId);

  const sendMessage = useSendMessage(scope, scopeId);
  const editMessage = useEditMessage(scope, scopeId);
  const deleteMessage = useDeleteMessage(scope, scopeId);
  const togglePinMessage = useTogglePinMessage(scope, scopeId);
  const toggleReaction = useToggleReaction(scope, scopeId);
  const markRead = useMarkChannelRead(scope, scopeId);
  const joinChannel = useJoinChannel(scope, scopeId);
  const updatePrefs = useUpdateChannelPreferences(scope, scopeId);

  // Mark channel as read when opened or when new latest message arrives while open
  const latestMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (
      activeChannel &&
      activeChannel.isMember &&
      (activeChannel.unreadCount > 0 ||
        (latestMessageId && activeChannel.lastReadMessageId !== latestMessageId))
    ) {
      markRead.mutate({ channelId: activeChannel.id, lastReadMessageId: latestMessageId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger when channel or latest message ID changes
  }, [activeChannel?.id, activeChannel?.isMember, activeChannel?.unreadCount, latestMessageId]);

  // Smoothly scroll to bottom when new messages arrive at the end
  useEffect(() => {
    if (!messageSearch && !pinnedOnly) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [latestMessageId, activeChannelId, messageSearch, pinnedOnly]);

  const participants = useMemo(() => {
    if (channelMembers.length > 0) return channelMembers.map((m) => m.profile);
    return contacts;
  }, [channelMembers, contacts]);

  const seenByMessageId = useMemo(
    () => computeSeenByMap(messages, channelMembers, currentActorId),
    [messages, channelMembers, currentActorId],
  );

  const latestOwnMessageId = useMemo(() => {
    if (!currentActorId) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (!m.deletedAt && m.senderId === currentActorId) return m.id;
    }
    return null;
  }, [messages, currentActorId]);

  const otherMemberCount = useMemo(
    () => channelMembers.filter((m) => m.actorId !== currentActorId).length,
    [channelMembers, currentActorId],
  );

  const typingNames = useMemo(() => {
    if (!typingMap) return [];
    return Object.keys(typingMap)
      .filter((actorId) => actorId !== currentActorId)
      .map((actorId) => participants.find((p) => p.id === actorId)?.displayName ?? "Someone");
  }, [typingMap, participants, currentActorId]);

  const canModerate =
    canManage || activeChannel?.myRole === "OWNER" || activeChannel?.myRole === "ADMIN";

  const handleSelectChannel = (channelId: string) => {
    setActiveChannel(scope, scopeId, channelId);
    setMessageSearch("");
    setPinnedOnly(false);
    setSearchOpen(false);
    setMobileShowFeed(true);
  };

  const jumpToMessage = (messageId: string) => {
    const el = document.getElementById(`chat-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const peerOnline = activeChannel?.peer
    ? (presenceOverrides[`${scope}:${activeChannel.peer.id}`] ?? activeChannel.peer.isOnline)
    : false;

  return (
    <div className="bg-card flex h-[calc(100dvh-10.5rem)] min-h-[540px] overflow-hidden rounded-xl border shadow-xs">
      {/* Sidebar */}
      <div className={cn("h-full w-full md:block md:w-76", mobileShowFeed ? "hidden" : "block")}>
        <ChatSidebar
          scope={scope}
          channels={channels}
          isLoading={channelsLoading}
          activeChannelId={activeChannelId}
          canWrite={canWrite}
          onSelectChannel={handleSelectChannel}
          onOpenNewChat={() => setNewChatOpen(true)}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived((prev) => !prev)}
        />
      </div>

      {/* Main Feed Pane */}
      <div
        className={cn("flex min-w-0 flex-1 flex-col", mobileShowFeed ? "flex" : "hidden md:flex")}
      >
        {!activeChannel ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={<MessageSquareIcon />}
              title="Select or start a conversation"
              description={
                scope === "platform"
                  ? "Collaborate with internal platform operators via channels and direct messages."
                  : "Message teammates directly or organize discussions into workspace channels."
              }
              action={
                canWrite ? (
                  <Button type="button" onClick={() => setNewChatOpen(true)}>
                    Start New Chat
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Active Channel Header */}
            <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                  onClick={() => setMobileShowFeed(false)}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {activeChannel.type === "PRIVATE" && (
                      <LockIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    {activeChannel.type === "PUBLIC" && (
                      <HashIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    {activeChannel.type === "GROUP" && (
                      <UsersIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                    )}
                    <h3 className="truncate text-sm font-semibold">
                      {activeChannel.name || "Conversation"}
                    </h3>
                    {activeChannel.type === "DIRECT" && (
                      <Badge
                        variant={peerOnline ? "success" : "secondary"}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {peerOnline ? "Online" : "Offline"}
                      </Badge>
                    )}
                    {activeChannel.isArchived && (
                      <Badge variant="outline" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {activeChannel.topic ||
                      activeChannel.description ||
                      `${activeChannel.memberCount} member${activeChannel.memberCount === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant={searchOpen ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  title="Search messages"
                  onClick={() => setSearchOpen((prev) => !prev)}
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant={pinnedOnly ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  title={pinnedOnly ? "Show all messages" : "Show pinned messages"}
                  onClick={() => setPinnedOnly((prev) => !prev)}
                >
                  <PinIcon className="h-4 w-4" />
                </Button>

                {activeChannel.isMember && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={activeChannel.isPinned ? "Unpin conversation" : "Pin conversation"}
                      onClick={() =>
                        void updatePrefs.mutateAsync({
                          channelId: activeChannel.id,
                          data: { isPinned: !activeChannel.isPinned },
                        })
                      }
                    >
                      {activeChannel.isPinned ? (
                        <PinOffIcon className="text-primary h-4 w-4" />
                      ) : (
                        <PinIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={activeChannel.isMuted ? "Unmute notifications" : "Mute notifications"}
                      onClick={() =>
                        void updatePrefs.mutateAsync({
                          channelId: activeChannel.id,
                          data: { isMuted: !activeChannel.isMuted },
                        })
                      }
                    >
                      {activeChannel.isMuted ? (
                        <BellOffIcon className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <BellIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Channel info & members"
                  onClick={() => setSettingsOpen(true)}
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Optional In-Channel Search Bar */}
            {searchOpen && (
              <div className="bg-muted/30 flex items-center gap-2 border-b px-4 py-2">
                <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                <Input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search messages in this conversation..."
                  className="h-8 text-xs"
                  autoFocus
                />
                {messageSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMessageSearch("")}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
              {hasNextPage && (
                <div className="mb-3 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? "Loading older messages..." : "Load older messages"}
                  </Button>
                </div>
              )}

              {messagesLoading ? (
                <div className="space-y-4 p-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-sm font-medium">
                      {pinnedOnly
                        ? "No pinned messages yet"
                        : messageSearch
                          ? "No messages match your search"
                          : `Welcome to ${activeChannel.type === "DIRECT" ? activeChannel.name : `#${activeChannel.name}`}`}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {pinnedOnly || messageSearch
                        ? "Try clearing your filter to view all messages."
                        : "Send a message below to kick off the conversation."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {messages.map((msg, idx) => {
                    const prev = idx > 0 ? messages[idx - 1] : undefined;
                    const showDateDivider =
                      !prev || !dayjs(prev.createdAt).isSame(dayjs(msg.createdAt), "day");
                    const isGrouped =
                      Boolean(prev) &&
                      !showDateDivider &&
                      prev!.senderId === msg.senderId &&
                      dayjs(msg.createdAt).diff(dayjs(prev!.createdAt), "minute") < 5;

                    return (
                      <div key={msg.id}>
                        {showDateDivider && (
                          <div className="my-3 flex items-center gap-3 px-3">
                            <div className="bg-border h-px flex-1" />
                            <span className="text-muted-foreground text-[11px] font-medium">
                              {formatMessageDateLabel(msg.createdAt)}
                            </span>
                            <div className="bg-border h-px flex-1" />
                          </div>
                        )}
                        <ChatMessageItem
                          scope={scope}
                          message={msg}
                          isGrouped={isGrouped}
                          isOwn={msg.senderId === currentActorId}
                          canModerate={Boolean(canModerate)}
                          isChannelArchived={activeChannel.isArchived}
                          participants={participants}
                          seenBy={seenByMessageId.get(msg.id) ?? []}
                          isLatestOwnMessage={msg.id === latestOwnMessageId}
                          isDirect={activeChannel.type === "DIRECT"}
                          otherMemberCount={otherMemberCount}
                          onReply={(m) => setReplyTo(activeChannel.id, m)}
                          onEdit={(m) => setEditingMessage(m)}
                          onDelete={(m) =>
                            void deleteMessage.mutateAsync({
                              channelId: activeChannel.id,
                              messageId: m.id,
                            })
                          }
                          onTogglePin={(m) =>
                            void togglePinMessage.mutateAsync({
                              channelId: activeChannel.id,
                              messageId: m.id,
                            })
                          }
                          onToggleReaction={(m, emoji) =>
                            void toggleReaction.mutateAsync({
                              channelId: activeChannel.id,
                              messageId: m.id,
                              emoji,
                            })
                          }
                          onJumpToMessage={jumpToMessage}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={feedEndRef} />
            </div>

            {/* Typing Indicator Bar */}
            {typingNames.length > 0 && (
              <div className="text-muted-foreground px-4 pb-1 text-xs italic">
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing...`
                  : `${typingNames.slice(0, 2).join(", ")} ${typingNames.length > 2 ? "and others " : ""}are typing...`}
              </div>
            )}

            {/* Composer or Join / Archived Banner */}
            {!activeChannel.isMember && activeChannel.type === "PUBLIC" ? (
              <div className="bg-muted/40 flex items-center justify-between border-t px-4 py-3">
                <p className="text-muted-foreground text-xs">
                  You are previewing <span className="font-semibold">#{activeChannel.name}</span>.
                  Join to send messages and react.
                </p>
                {canWrite && (
                  <Button
                    size="sm"
                    disabled={joinChannel.isPending}
                    onClick={() => void joinChannel.mutateAsync(activeChannel.id)}
                  >
                    {joinChannel.isPending ? "Joining..." : "Join Channel"}
                  </Button>
                )}
              </div>
            ) : activeChannel.isArchived ? (
              <div className="bg-muted/40 text-muted-foreground border-t px-4 py-3 text-center text-xs">
                This channel has been archived. Messages are read-only.
              </div>
            ) : !canWrite ? (
              <div className="bg-muted/40 text-muted-foreground border-t px-4 py-3 text-center text-xs">
                You have read-only chat permissions in this scope.
              </div>
            ) : (
              <ChatComposer
                scope={scope}
                channelId={activeChannel.id}
                channelLabel={
                  activeChannel.type === "DIRECT"
                    ? (activeChannel.name ?? "colleague")
                    : `#${activeChannel.name ?? "channel"}`
                }
                participants={participants}
                isSending={sendMessage.isPending || editMessage.isPending}
                onSend={async (payload) => {
                  await sendMessage.mutateAsync({
                    channelId: activeChannel.id,
                    ...payload,
                  });
                }}
                onSaveEdit={async (messageId, body, mentions) => {
                  await editMessage.mutateAsync({
                    channelId: activeChannel.id,
                    messageId,
                    body,
                    mentions,
                  });
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        scope={scope}
        scopeId={scopeId}
        currentActorId={currentActorId}
      />

      {activeChannel && (
        <ChannelSettingsDialog
          key={activeChannel.id}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          scope={scope}
          scopeId={scopeId}
          channel={activeChannel}
          members={channelMembers}
          currentActorId={currentActorId}
          canManageAll={canManage}
        />
      )}
    </div>
  );
}
