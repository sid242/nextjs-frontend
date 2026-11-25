"use client";

import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  LogOutIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { resolveStorageUrl } from "@/lib/storage";

import {
  useAddChannelMembers,
  useChatContacts,
  useLeaveChannel,
  useRemoveChannelMember,
  useUpdateChannel,
  useUpdateChannelMemberRole,
} from "../queries";
import type { ChatChannel, ChatMember, ChatScope } from "../types";
import { getInitials } from "../utils";

interface ChannelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: ChatScope;
  scopeId: string;
  channel: ChatChannel;
  members: ChatMember[];
  currentActorId?: string;
  canManageAll: boolean;
}

export function ChannelSettingsDialog({
  open,
  onOpenChange,
  scope,
  scopeId,
  channel,
  members,
  currentActorId,
  canManageAll,
}: ChannelSettingsDialogProps) {
  const [name, setName] = useState(channel.name ?? "");
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [description, setDescription] = useState(channel.description ?? "");
  const [inviteSearch, setInviteSearch] = useState("");

  const { data: contacts = [] } = useChatContacts(scope, scopeId);
  const updateChannel = useUpdateChannel(scope, scopeId);
  const addMembers = useAddChannelMembers(scope, scopeId);
  const removeMember = useRemoveChannelMember(scope, scopeId);
  const updateRole = useUpdateChannelMemberRole(scope, scopeId);
  const leaveChannel = useLeaveChannel(scope, scopeId);

  const isAdmin = canManageAll || channel.myRole === "OWNER" || channel.myRole === "ADMIN";
  const isDirect = channel.type === "DIRECT";

  const memberIds = useMemo(() => new Set(members.map((m) => m.actorId)), [members]);
  const invitableContacts = useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      if (memberIds.has(c.id)) return false;
      if (!q) return true;
      return c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [contacts, memberIds, inviteSearch]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await updateChannel.mutateAsync({
      channelId: channel.id,
      data: {
        name: name.trim(),
        topic: topic.trim() || null,
        description: description.trim() || null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isDirect ? "Conversation Details" : `#${channel.name}`}</DialogTitle>
          <DialogDescription>
            {channel.type} · {members.length} participant{members.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        {!isDirect && isAdmin && (
          <form onSubmit={(e) => void handleSaveDetails(e)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-chan-name">Channel Name</Label>
              <Input
                id="edit-chan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-chan-topic">Topic</Label>
              <Input
                id="edit-chan-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Channel topic..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-chan-desc">Description</Label>
              <Textarea
                id="edit-chan-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void updateChannel.mutateAsync({
                    channelId: channel.id,
                    data: { isArchived: !channel.isArchived },
                  })
                }
              >
                {channel.isArchived ? (
                  <>
                    <ArchiveRestoreIcon className="mr-1.5 h-3.5 w-3.5" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <ArchiveIcon className="mr-1.5 h-3.5 w-3.5" />
                    Archive
                  </>
                )}
              </Button>
              <Button type="submit" size="sm" disabled={updateChannel.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        <Separator />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-wider uppercase">
              Members ({members.length})
            </h4>
          </div>

          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {m.profile.avatarUrl && (
                      <AvatarImage
                        src={resolveStorageUrl(m.profile.avatarUrl)}
                        alt={m.profile.displayName}
                      />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(m.profile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium">{m.profile.displayName}</span>
                      <Badge variant="outline" className="px-1 py-0 text-[10px]">
                        {m.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate text-[11px]">{m.profile.email}</p>
                  </div>
                </div>

                {!isDirect && isAdmin && m.actorId !== currentActorId && m.role !== "OWNER" && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={m.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                      onClick={() =>
                        void updateRole.mutateAsync({
                          channelId: channel.id,
                          memberId: m.actorId,
                          role: m.role === "ADMIN" ? "MEMBER" : "ADMIN",
                        })
                      }
                    >
                      <ShieldIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-7 w-7"
                      title="Remove from channel"
                      onClick={() =>
                        void removeMember.mutateAsync({
                          channelId: channel.id,
                          memberId: m.actorId,
                        })
                      }
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isDirect && !channel.isArchived && (channel.type !== "PRIVATE" || isAdmin) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase">Add Members</Label>
              <Input
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="Search colleagues to add..."
                className="h-8 text-xs"
              />
              {invitableContacts.length > 0 ? (
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-1.5">
                  {invitableContacts.slice(0, 15).map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs"
                    >
                      <span className="truncate">
                        {person.displayName}{" "}
                        <span className="text-muted-foreground">({person.email})</span>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        disabled={addMembers.isPending}
                        onClick={() =>
                          void addMembers.mutateAsync({
                            channelId: channel.id,
                            memberIds: [person.id],
                          })
                        }
                      >
                        <UserPlusIcon className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Everyone in the directory is already in this channel.
                </p>
              )}
            </div>
          </>
        )}

        {!isDirect && channel.isMember && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={leaveChannel.isPending}
              onClick={() =>
                void leaveChannel.mutateAsync(channel.id).then(() => onOpenChange(false))
              }
            >
              <LogOutIcon className="mr-1.5 h-3.5 w-3.5" />
              Leave Channel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
