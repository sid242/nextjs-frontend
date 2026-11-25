"use client";

import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  BellOffIcon,
  HashIcon,
  LockIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

import { useChatStore } from "../store";
import type { ChatChannel, ChatScope } from "../types";
import { formatChannelTimestamp, getInitials } from "../utils";

interface ChatSidebarProps {
  scope: ChatScope;
  channels: ChatChannel[];
  isLoading: boolean;
  activeChannelId: string | null;
  canWrite: boolean;
  onSelectChannel: (channelId: string) => void;
  onOpenNewChat: () => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
}

function ChannelRow({
  channel,
  scope,
  isActive,
  onSelect,
}: {
  channel: ChatChannel;
  scope: ChatScope;
  isActive: boolean;
  onSelect: () => void;
}) {
  const presenceOverrides = useChatStore((s) => s.presenceOverrides);
  const peer = channel.peer;
  const isPeerOnline = peer ? (presenceOverrides[`${scope}:${peer.id}`] ?? peer.isOnline) : false;

  const renderIcon = () => {
    if (channel.type === "DIRECT" && peer) {
      return (
        <div className="relative shrink-0">
          <Avatar className="h-7 w-7">
            {peer.avatarUrl && (
              <AvatarImage src={resolveStorageUrl(peer.avatarUrl)} alt={peer.displayName} />
            )}
            <AvatarFallback className="text-[10px] font-semibold">
              {getInitials(peer.displayName)}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "border-background absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2",
              isPeerOnline ? "bg-emerald-500" : "bg-muted-foreground/40",
            )}
            title={isPeerOnline ? "Online" : "Offline"}
          />
        </div>
      );
    }

    if (channel.type === "PRIVATE") {
      return (
        <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
          <LockIcon className="text-muted-foreground h-3.5 w-3.5" />
        </div>
      );
    }

    if (channel.type === "GROUP") {
      return (
        <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
          <UsersIcon className="text-muted-foreground h-3.5 w-3.5" />
        </div>
      );
    }

    return (
      <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
        <HashIcon className="text-muted-foreground h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {renderIcon()}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "truncate text-sm",
              channel.unreadCount > 0 || isActive ? "text-foreground font-semibold" : "font-medium",
            )}
          >
            {channel.name || "Conversation"}
          </span>
          <span className="text-muted-foreground shrink-0 text-[10px]">
            {formatChannelTimestamp(channel.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-muted-foreground truncate text-xs">
            {channel.isArchived
              ? "Archived"
              : channel.lastMessagePreview ||
                (!channel.isMember && channel.type === "PUBLIC"
                  ? "Public channel · Click to preview"
                  : "No messages yet")}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {channel.isMuted && <BellOffIcon className="text-muted-foreground h-3 w-3" />}
            {channel.isPinned && <PinIcon className="text-primary h-3 w-3" />}
            {channel.unreadCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] leading-none">
                {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ChatSidebar({
  scope,
  channels,
  isLoading,
  activeChannelId,
  canWrite,
  onSelectChannel,
  onOpenNewChat,
  showArchived,
  onToggleShowArchived,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.topic ?? "").toLowerCase().includes(q) ||
        (c.peer?.email ?? "").toLowerCase().includes(q),
    );
  }, [channels, search]);

  const pinned = filtered.filter((c) => c.isPinned);
  const directMessages = filtered.filter((c) => !c.isPinned && c.type === "DIRECT");
  const roomChannels = filtered.filter((c) => !c.isPinned && c.type !== "DIRECT");
  const totalUnread = channels.reduce((acc, c) => acc + (c.isMuted ? 0 : c.unreadCount), 0);

  return (
    <aside className="bg-card flex h-full w-full flex-col border-r md:w-76 md:shrink-0">
      <div className="flex items-center justify-between border-b px-3.5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">
            {scope === "platform" ? "Operator Chat" : "Workspace Chat"}
          </h2>
          {totalUnread > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
              {totalUnread} unread
            </Badge>
          )}
        </div>
        {canWrite && (
          <Button size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onOpenNewChat}>
            <PlusIcon className="h-3.5 w-3.5" />
            New
          </Button>
        )}
      </div>

      <div className="border-b p-2.5">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter channels & people..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-1.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-muted-foreground text-xs">
              {search
                ? "No conversations match your filter."
                : "No channels or direct messages yet."}
            </p>
            {canWrite && !search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-7 text-xs"
                onClick={onOpenNewChat}
              >
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-muted-foreground px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                  Pinned
                </p>
                {pinned.map((c) => (
                  <ChannelRow
                    key={c.id}
                    channel={c}
                    scope={scope}
                    isActive={c.id === activeChannelId}
                    onSelect={() => onSelectChannel(c.id)}
                  />
                ))}
              </div>
            )}

            <div className="space-y-0.5">
              <p className="text-muted-foreground px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                Channels ({roomChannels.length})
              </p>
              {roomChannels.map((c) => (
                <ChannelRow
                  key={c.id}
                  channel={c}
                  scope={scope}
                  isActive={c.id === activeChannelId}
                  onSelect={() => onSelectChannel(c.id)}
                />
              ))}
            </div>

            <div className="space-y-0.5">
              <p className="text-muted-foreground px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                Direct Messages ({directMessages.length})
              </p>
              {directMessages.map((c) => (
                <ChannelRow
                  key={c.id}
                  channel={c}
                  scope={scope}
                  isActive={c.id === activeChannelId}
                  onSelect={() => onSelectChannel(c.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 w-full justify-start gap-2 text-xs"
          onClick={onToggleShowArchived}
        >
          <ArchiveIcon className="h-3.5 w-3.5" />
          {showArchived ? "Hide archived channels" : "Show archived channels"}
        </Button>
      </div>
    </aside>
  );
}
