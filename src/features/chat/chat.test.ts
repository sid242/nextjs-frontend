import { describe, expect, it } from "vitest";

import { chatKeys } from "./keys";
import { createChannelSchema, editMessageSchema, sendMessageSchema } from "./schemas";
import {
  computeSeenByMap,
  extractMentionIds,
  formatBytes,
  formatSeenByLabel,
  getInitials,
  isImageMimeType,
} from "./utils";

describe("Chat feature schemas, keys, and helpers", () => {
  it("isolates tenant and platform query keys", () => {
    const tKey = chatKeys.channels("tenant", "t-1");
    const pKey = chatKeys.channels("platform", "platform");
    expect(tKey).not.toEqual(pKey);
    expect(chatKeys.messages("tenant", "t-1", "c-1", { pinnedOnly: true })).toEqual([
      "chat",
      "tenant",
      "t-1",
      "messages",
      "c-1",
      { pinnedOnly: true },
    ]);
  });

  it("validates channel creation and message composer schemas", () => {
    expect(
      createChannelSchema.parse({
        type: "PRIVATE",
        name: "Engineering",
        memberIds: [],
      }),
    ).toMatchObject({ type: "PRIVATE", name: "Engineering" });

    expect(() => sendMessageSchema.parse({ body: "   ", attachmentsCount: 0 })).toThrow();
    expect(sendMessageSchema.parse({ body: "", attachmentsCount: 1 })).toMatchObject({
      attachmentsCount: 1,
    });
    expect(() => editMessageSchema.parse({ body: "  " })).toThrow();
  });

  it("extracts @mention actor IDs and formats helpers cleanly", () => {
    const participants = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Alice Chen",
        email: "alice@example.com",
        avatarUrl: null,
        roleLabel: "Engineer",
        isOnline: true,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        displayName: "Bob Rao",
        email: "bob@example.com",
        avatarUrl: null,
        roleLabel: "SRE",
        isOnline: false,
      },
    ];

    expect(extractMentionIds("Hey @Alice Chen please check with @Bob Rao", participants)).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);

    expect(getInitials("Alice Chen")).toBe("AC");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("application/pdf")).toBe(false);
  });

  it("computes per-message seen receipts from channel member cursors", () => {
    const alice = {
      id: "11111111-1111-4111-8111-111111111111",
      displayName: "Alice Chen",
      email: "alice@example.com",
      avatarUrl: null,
      roleLabel: "Owner",
      isOnline: true,
    };
    const bob = {
      id: "22222222-2222-4222-8222-222222222222",
      displayName: "Bob Rao",
      email: "bob@example.com",
      avatarUrl: null,
      roleLabel: "Admin",
      isOnline: true,
    };
    const baseMsg = {
      channelId: "ch-1",
      senderId: alice.id,
      sender: alice,
      type: "TEXT" as const,
      parentMessageId: null,
      parentMessage: null,
      replyCount: 0,
      mentions: [],
      attachments: [],
      reactions: [],
      isPinned: false,
      pinnedByActorId: null,
      pinnedAt: null,
      editedAt: null,
      deletedAt: null,
      updatedAt: "2026-11-25T10:00:00.000Z",
    };
    const messages = [
      { ...baseMsg, id: "m1", body: "First", createdAt: "2026-11-25T10:00:00.000Z" },
      { ...baseMsg, id: "m2", body: "Second", createdAt: "2026-11-25T10:01:00.000Z" },
    ];
    const members = [
      {
        id: "mem-1",
        channelId: "ch-1",
        actorId: alice.id,
        role: "OWNER" as const,
        isMuted: false,
        isPinned: false,
        lastReadAt: "2026-11-25T10:01:00.000Z",
        lastReadMessageId: "m2",
        unreadCount: 0,
        joinedAt: "2026-11-25T09:00:00.000Z",
        profile: alice,
      },
      {
        id: "mem-2",
        channelId: "ch-1",
        actorId: bob.id,
        role: "ADMIN" as const,
        isMuted: false,
        isPinned: false,
        lastReadAt: "2026-11-25T10:00:00.000Z",
        lastReadMessageId: "m1",
        unreadCount: 1,
        joinedAt: "2026-11-25T09:00:00.000Z",
        profile: bob,
      },
    ];

    const seenMap = computeSeenByMap(messages, members, alice.id);
    expect(seenMap.get("m1")?.map((p) => p.displayName)).toEqual(["Bob Rao"]);
    expect(seenMap.get("m2") ?? []).toEqual([]);

    expect(formatSeenByLabel([], false)).toBe("Not seen yet");
    expect(formatSeenByLabel([bob], true)).toBe("Seen");
    expect(formatSeenByLabel([bob], false)).toBe("Seen by Bob Rao");
  });
});
