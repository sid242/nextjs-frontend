import dayjs from "dayjs";

import type { ChatMember, ChatMessage, ChatParticipantProfile } from "./types";

export const QUICK_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "🚀",
  "👀",
  "🔥",
  "👏",
  "🙌",
  "🤔",
  "😮",
  "✅",
] as const;

export const COMPOSER_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "🚀",
  "🔥",
  "👀",
  "👏",
  "🙌",
  "✅",
  "⚡",
  "💡",
  "🙏",
  "🤔",
  "😅",
  "🥳",
  "😎",
  "💯",
] as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function formatMessageTime(isoDate: string): string {
  return dayjs(isoDate).format("HH:mm");
}

export function formatMessageDateLabel(isoDate: string): string {
  const target = dayjs(isoDate).startOf("day");
  const today = dayjs().startOf("day");
  const diffDays = today.diff(target, "day");
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return target.format("dddd");
  return target.format("MMM D, YYYY");
}

export function formatChannelTimestamp(isoDate: string | null): string {
  if (!isoDate) return "";
  const target = dayjs(isoDate);
  if (target.isSame(dayjs(), "day")) return target.format("HH:mm");
  if (target.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  if (target.isSame(dayjs(), "year")) return target.format("MMM D");
  return target.format("MM/DD/YY");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractMentionIds(body: string, participants: ChatParticipantProfile[]): string[] {
  const lower = body.toLowerCase();
  const ids: string[] = [];
  for (const p of participants) {
    const handle = `@${p.displayName}`.toLowerCase();
    if (p.displayName && lower.includes(handle)) {
      ids.push(p.id);
    }
  }
  return Array.from(new Set(ids));
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Computes which other channel members have seen each loaded message using
 * each member's read cursor (`lastReadMessageId` index order, falling back to `lastReadAt`).
 */
export function computeSeenByMap(
  messages: ChatMessage[],
  members: ChatMember[],
  currentActorId?: string,
): Map<string, ChatParticipantProfile[]> {
  const seenByMessageId = new Map<string, ChatParticipantProfile[]>();
  if (messages.length === 0 || members.length === 0) return seenByMessageId;

  const indexById = new Map<string, number>();
  messages.forEach((m, idx) => indexById.set(m.id, idx));

  const otherMembers = members.filter((m) => m.actorId !== currentActorId);
  for (const member of otherMembers) {
    const cursorIdx = member.lastReadMessageId
      ? indexById.get(member.lastReadMessageId)
      : undefined;
    const readAtMs = member.lastReadAt ? new Date(member.lastReadAt).getTime() : null;
    if (cursorIdx === undefined && readAtMs === null) continue;

    for (let idx = 0; idx < messages.length; idx++) {
      const msg = messages[idx]!;
      if (msg.deletedAt) continue;

      const isSeen =
        cursorIdx !== undefined
          ? idx <= cursorIdx
          : readAtMs !== null && readAtMs >= new Date(msg.createdAt).getTime();

      if (isSeen) {
        const list = seenByMessageId.get(msg.id);
        if (list) list.push(member.profile);
        else seenByMessageId.set(msg.id, [member.profile]);
      }
    }
  }

  return seenByMessageId;
}

export function formatSeenByLabel(seenBy: ChatParticipantProfile[], isDirect: boolean): string {
  if (seenBy.length === 0) return "Not seen yet";
  if (isDirect) return "Seen";
  if (seenBy.length === 1) return `Seen by ${seenBy[0]!.displayName}`;
  if (seenBy.length === 2) return `Seen by ${seenBy[0]!.displayName}, ${seenBy[1]!.displayName}`;
  return `Seen by ${seenBy[0]!.displayName}, ${seenBy[1]!.displayName} +${seenBy.length - 2}`;
}
