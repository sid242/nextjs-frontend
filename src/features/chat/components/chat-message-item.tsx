"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCheckIcon,
  CheckIcon,
  CornerUpLeftIcon,
  DownloadIcon,
  FileIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  SmilePlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

import { createChatApi } from "../api";
import type { ChatAttachment, ChatMessage, ChatParticipantProfile, ChatScope } from "../types";
import {
  formatBytes,
  formatMessageTime,
  formatSeenByLabel,
  getInitials,
  isImageMimeType,
  QUICK_EMOJIS,
} from "../utils";

interface ChatMessageItemProps {
  scope: ChatScope;
  message: ChatMessage;
  isGrouped: boolean;
  isOwn: boolean;
  canModerate: boolean;
  isChannelArchived: boolean;
  participants: ChatParticipantProfile[];
  seenBy?: ChatParticipantProfile[];
  isLatestOwnMessage?: boolean;
  isDirect?: boolean;
  otherMemberCount?: number;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onTogglePin: (message: ChatMessage) => void;
  onToggleReaction: (message: ChatMessage, emoji: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

function renderBodyWithMentions(body: string, participants: ChatParticipantProfile[]): ReactNode {
  if (!body) return null;
  const names = participants
    .map((p) => p.displayName)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (names.length === 0) return body;

  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(@(?:${escaped.join("|")}))`, "gi");
  const segments = body.split(regex);

  return segments.map((part, idx) => {
    if (part.startsWith("@") && names.some((n) => `@${n}`.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={idx} className="bg-primary/15 text-primary rounded px-1 py-0.5 font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ChatMessageItem({
  scope,
  message,
  isGrouped,
  isOwn,
  canModerate,
  isChannelArchived,
  participants,
  seenBy = [],
  isLatestOwnMessage = false,
  isDirect = false,
  otherMemberCount = 0,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReaction,
  onJumpToMessage,
}: ChatMessageItemProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  const isDeleted = Boolean(message.deletedAt);
  const actionsPinnedVisible = emojiOpen || menuOpen;
  const isSeen = seenBy.length > 0;
  const seenLabel = isSeen || otherMemberCount > 0 ? formatSeenByLabel(seenBy, isDirect) : "Sent";

  const handleDownload = async (att: ChatAttachment) => {
    try {
      setDownloadingId(att.id);
      const { downloadUrl } = await chatApi.getAttachmentDownloadUrl({
        channelId: message.channelId,
        key: att.key,
        filename: att.filename,
        disposition: "attachment",
      });
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      id={`chat-msg-${message.id}`}
      className={cn(
        "group hover:bg-muted/40 relative flex gap-3 rounded-lg px-3 py-1 transition-colors",
        !isGrouped && "mt-2.5 pt-1.5",
        message.isPinned && !isDeleted && "bg-amber-500/5",
      )}
    >
      {/* Left avatar or compact timestamp */}
      <div className="w-8 shrink-0 pt-0.5">
        {!isGrouped ? (
          <Avatar className="h-8 w-8">
            {message.sender.avatarUrl && (
              <AvatarImage
                src={resolveStorageUrl(message.sender.avatarUrl)}
                alt={message.sender.displayName}
              />
            )}
            <AvatarFallback className="text-[11px] font-semibold">
              {getInitials(message.sender.displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-muted-foreground hidden pt-1 text-[10px] group-hover:block">
            {formatMessageTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Main message body */}
      <div className="min-w-0 flex-1">
        {!isGrouped && (
          <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{message.sender.displayName}</span>
            {message.sender.roleLabel && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                {message.sender.roleLabel}
              </Badge>
            )}
            <span className="text-muted-foreground text-[11px]">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && !isDeleted && (
              <span title={seenLabel} aria-label={seenLabel} className="inline-flex items-center">
                {isSeen ? (
                  <CheckCheckIcon className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                ) : (
                  <CheckIcon className="text-muted-foreground h-3.5 w-3.5" />
                )}
              </span>
            )}
            {message.isPinned && !isDeleted && (
              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                <PinIcon className="h-2.5 w-2.5" />
                Pinned
              </Badge>
            )}
          </div>
        )}

        {/* Quoted parent message */}
        {!isDeleted && message.parentMessage && (
          <button
            type="button"
            onClick={() => onJumpToMessage?.(message.parentMessage!.id)}
            className="border-primary/40 bg-muted/60 hover:bg-muted mb-1.5 flex max-w-full items-center gap-2 rounded border-l-2 px-2.5 py-1 text-left text-xs"
          >
            <CornerUpLeftIcon className="text-muted-foreground h-3 w-3 shrink-0" />
            <span className="font-medium">{message.parentMessage.senderName}:</span>
            <span className="text-muted-foreground truncate">{message.parentMessage.body}</span>
          </button>
        )}

        {/* Text body */}
        {isDeleted ? (
          <p className="text-muted-foreground text-sm italic">This message was deleted.</p>
        ) : (
          message.body && (
            <div className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
              {renderBodyWithMentions(message.body, participants)}
              {message.editedAt && (
                <span className="text-muted-foreground ml-1.5 text-[11px]">(edited)</span>
              )}
            </div>
          )
        )}

        {/* Attachments */}
        {!isDeleted && message.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <button
                key={att.id}
                type="button"
                disabled={downloadingId === att.id}
                onClick={() => void handleDownload(att)}
                className="bg-card hover:bg-muted flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors"
              >
                <FileIcon className="text-primary h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="max-w-48 truncate font-medium">{att.filename}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {isImageMimeType(att.mimeType) ? "Image" : "File"} ·{" "}
                    {formatBytes(att.sizeBytes)}
                  </p>
                </div>
                <DownloadIcon className="text-muted-foreground ml-1 h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Reactions */}
        {!isDeleted && message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.reactions.map((rx) => (
              <button
                key={rx.emoji}
                type="button"
                disabled={isChannelArchived}
                onClick={() => onToggleReaction(message, rx.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  rx.reactedByMe
                    ? "border-primary/40 bg-primary/10 text-primary font-medium"
                    : "bg-card hover:bg-muted text-foreground",
                )}
              >
                <span>{rx.emoji}</span>
                <span className="text-[11px]">{rx.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Read receipt indicator on latest own message */}
        {!isDeleted && isOwn && isLatestOwnMessage && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[11px]",
              isSeen ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground",
            )}
          >
            {isSeen ? (
              <CheckCheckIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{seenLabel}</span>
          </div>
        )}
      </div>

      {/* Action bar: always inline-accessible on mobile/touch; floats on hover/focus/open on desktop */}
      {!isDeleted && !isChannelArchived && (
        <div
          className={cn(
            "z-10 flex shrink-0 items-center gap-0.5 self-start transition-opacity",
            "md:bg-card md:absolute md:-top-3 md:right-3 md:rounded-md md:border md:p-0.5 md:shadow-xs",
            actionsPinnedVisible
              ? "pointer-events-auto opacity-100"
              : "pointer-events-auto opacity-100 md:pointer-events-none md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
          )}
        >
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Add reaction">
                <SmilePlusIcon className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1.5" align="end">
              <div className="grid grid-cols-6 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onToggleReaction(message, emoji);
                      setEmojiOpen(false);
                    }}
                    className="hover:bg-muted rounded p-1 text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Reply"
            onClick={() => onReply(message)}
          >
            <CornerUpLeftIcon className="h-3.5 w-3.5" />
          </Button>

          {(isOwn || canModerate) && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="More actions">
                  <MoreHorizontalIcon className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" sideOffset={6}>
                {isOwn && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>
                    <PencilIcon className="mr-2 h-3.5 w-3.5" />
                    Edit message
                  </DropdownMenuItem>
                )}
                {canModerate && (
                  <DropdownMenuItem onClick={() => onTogglePin(message)}>
                    <PinIcon className="mr-2 h-3.5 w-3.5" />
                    {message.isPinned ? "Unpin message" : "Pin message"}
                  </DropdownMenuItem>
                )}
                {(isOwn || canModerate) && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(message)}
                  >
                    <Trash2Icon className="mr-2 h-3.5 w-3.5" />
                    Delete message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
