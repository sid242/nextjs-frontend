"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CornerUpLeftIcon,
  FileIcon,
  PaperclipIcon,
  PencilIcon,
  SendHorizontalIcon,
  SmileIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/features/realtime";

import { createChatApi, uploadChatAttachmentToS3 } from "../api";
import { useChatStore } from "../store";
import type { ChatAttachment, ChatParticipantProfile, ChatScope } from "../types";
import { COMPOSER_EMOJIS, extractMentionIds, formatBytes } from "../utils";

interface ChatComposerProps {
  scope: ChatScope;
  channelId: string;
  channelLabel: string;
  participants: ChatParticipantProfile[];
  isSending: boolean;
  onSend: (payload: {
    body: string;
    parentMessageId?: string | null;
    mentions: string[];
    attachments: ChatAttachment[];
  }) => Promise<void>;
  onSaveEdit: (messageId: string, body: string, mentions: string[]) => Promise<void>;
}

interface PendingUpload {
  localId: string;
  filename: string;
  sizeBytes: number;
  progress: number;
  attachment?: ChatAttachment;
}

export function ChatComposer({
  scope,
  channelId,
  channelLabel,
  participants,
  isSending,
  onSend,
  onSaveEdit,
}: ChatComposerProps) {
  const socket = useSocket();
  const chatApi = useMemo(() => createChatApi(scope), [scope]);

  const draft = useChatStore((s) => s.drafts[channelId] ?? "");
  const replyTo = useChatStore((s) => s.replyToByChannel[channelId] ?? null);
  const editingMessage = useChatStore((s) => s.editingMessage);
  const setDraft = useChatStore((s) => s.setDraft);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const setEditingMessage = useChatStore((s) => s.setEditingMessage);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [editDraft, setEditDraft] = useState<{ messageId: string; body: string } | null>(null);

  useEffect(() => {
    if (editingMessage) {
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const currentInputValue = editingMessage
    ? editDraft?.messageId === editingMessage.id
      ? editDraft.body
      : editingMessage.body
    : draft;

  const setInputValue = (val: string) => {
    if (editingMessage) {
      setEditDraft({ messageId: editingMessage.id, body: val });
    } else {
      setDraft(channelId, val);
    }

    // Detect trailing @mention query
    const match = val.match(/(?:^|\s)@([^\s@]{0,30})$/);
    setMentionQuery(match ? (match[1] ?? "") : null);

    // Emit typing state when composing a new message
    if (!editingMessage && socket) {
      if (!isTypingRef.current && val.trim().length > 0) {
        isTypingRef.current = true;
        socket.emit("chat:typing", { channelId, isTyping: true });
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          socket.emit("chat:typing", { channelId, isTyping: false });
        }
      }, 2200);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current && socket) {
        isTypingRef.current = false;
        socket.emit("chat:typing", { channelId, isTyping: false });
      }
    };
  }, [channelId, socket]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return participants
      .filter((p) => p.displayName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [participants, mentionQuery]);

  const insertMention = (person: ChatParticipantProfile) => {
    const replaced = currentInputValue.replace(
      /(^|\s)@([^\s@]{0,30})$/,
      `$1@${person.displayName} `,
    );
    setInputValue(replaced);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    for (const file of files) {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploads((prev) => [
        ...prev,
        { localId, filename: file.name, sizeBytes: file.size, progress: 5 },
      ]);

      try {
        const presigned = await chatApi.presignAttachment({
          channelId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
        const uploaded = await uploadChatAttachmentToS3(presigned, file, (pct) => {
          setUploads((prev) =>
            prev.map((u) => (u.localId === localId ? { ...u, progress: pct } : u)),
          );
        });
        setUploads((prev) =>
          prev.map((u) =>
            u.localId === localId ? { ...u, progress: 100, attachment: uploaded } : u,
          ),
        );
      } catch (err) {
        setUploads((prev) => prev.filter((u) => u.localId !== localId));
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
  };

  const hasPendingUploads = uploads.some((u) => !u.attachment);
  const completedAttachments = uploads
    .map((u) => u.attachment)
    .filter((a): a is ChatAttachment => Boolean(a));

  const handleSubmit = async () => {
    if (editingMessage) {
      const trimmed = currentInputValue.trim();
      if (!trimmed) return;
      const mentions = extractMentionIds(trimmed, participants);
      await onSaveEdit(editingMessage.id, trimmed, mentions);
      setEditDraft(null);
      return;
    }

    if (hasPendingUploads) {
      toast.info("Wait for file uploads to finish before sending.");
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed && completedAttachments.length === 0) return;

    const mentions = extractMentionIds(trimmed, participants);
    await onSend({
      body: trimmed,
      parentMessageId: replyTo?.id ?? null,
      mentions,
      attachments: completedAttachments,
    });

    setDraft(channelId, "");
    setReplyTo(channelId, null);
    setUploads([]);
    setMentionQuery(null);
    if (isTypingRef.current && socket) {
      isTypingRef.current = false;
      socket.emit("chat:typing", { channelId, isTyping: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape" && editingMessage) {
      setEditingMessage(null);
    }
  };

  return (
    <div className="bg-card relative border-t p-3">
      {/* Mention Autocomplete Popover */}
      {mentionSuggestions.length > 0 && (
        <div className="bg-popover absolute bottom-full left-3 z-20 mb-2 w-72 rounded-lg border p-1 shadow-lg">
          <p className="text-muted-foreground px-2 py-1 text-[10px] font-semibold uppercase">
            Mention colleague
          </p>
          {mentionSuggestions.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => insertMention(person)}
              className="hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs"
            >
              <span className="truncate font-medium">{person.displayName}</span>
              <span className="text-muted-foreground ml-2 truncate text-[11px]">
                {person.email}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Reply-to or Editing banner */}
      {editingMessage ? (
        <div className="bg-muted/70 mb-2 flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <PencilIcon className="text-primary h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Editing message</span>
            <span className="text-muted-foreground truncate">{editingMessage.body}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setEditingMessage(null)}
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        replyTo && (
          <div className="bg-muted/70 mb-2 flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <CornerUpLeftIcon className="text-primary h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Replying to {replyTo.sender.displayName}:</span>
              <span className="text-muted-foreground truncate">{replyTo.body || "Attachment"}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setReplyTo(channelId, null)}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      )}

      {/* Staged file uploads */}
      {uploads.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {uploads.map((u) => (
            <div
              key={u.localId}
              className="bg-muted/60 flex w-56 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
            >
              <FileIcon className="text-primary h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.filename}</p>
                {u.attachment ? (
                  <p className="text-muted-foreground text-[10px]">{formatBytes(u.sizeBytes)}</p>
                ) : (
                  <Progress value={u.progress} className="mt-1 h-1" />
                )}
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setUploads((prev) => prev.filter((item) => item.localId !== u.localId))
                }
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer input & toolbar */}
      <div className="bg-background focus-within:ring-ring flex flex-col rounded-xl border focus-within:ring-1">
        <Textarea
          ref={textareaRef}
          value={currentInputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            editingMessage
              ? "Edit your message..."
              : `Message ${channelLabel} (Enter to send, Shift+Enter for new line, @ to mention)`
          }
          rows={2}
          className="min-h-12 resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center justify-between border-t px-2 py-1.5">
          <div className="flex items-center gap-1">
            {!editingMessage && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleFilePick(e)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="h-4 w-4" />
                </Button>
              </>
            )}

            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Emoji">
                  <SmileIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" align="start">
                <div className="grid grid-cols-6 gap-1">
                  {COMPOSER_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputValue(`${currentInputValue}${emoji}`);
                        setEmojiOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="hover:bg-muted rounded p-1 text-base transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-1.5">
            {editingMessage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditingMessage(null)}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5 px-3 text-xs"
              disabled={
                isSending ||
                hasPendingUploads ||
                (!currentInputValue.trim() && completedAttachments.length === 0)
              }
              onClick={() => void handleSubmit()}
            >
              <SendHorizontalIcon className="h-3.5 w-3.5" />
              {editingMessage ? "Save" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
