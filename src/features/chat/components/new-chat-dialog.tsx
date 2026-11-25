"use client";

import { useMemo, useState } from "react";
import { CheckIcon, HashIcon, LockIcon, SearchIcon, UsersIcon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { resolveStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

import { useChatContacts, useCreateChannel, useCreateDirectChannel } from "../queries";
import { useChatStore } from "../store";
import type { ChatScope } from "../types";
import { getInitials } from "../utils";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: ChatScope;
  scopeId: string;
  currentActorId?: string;
}

export function NewChatDialog({
  open,
  onOpenChange,
  scope,
  scopeId,
  currentActorId,
}: NewChatDialogProps) {
  const [contactSearch, setContactSearch] = useState("");
  const [channelType, setChannelType] = useState<"PUBLIC" | "PRIVATE" | "GROUP">("PUBLIC");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const presenceOverrides = useChatStore((s) => s.presenceOverrides);
  const { data: contacts = [], isLoading } = useChatContacts(scope, scopeId);
  const createDirect = useCreateDirectChannel(scope, scopeId);
  const createChannel = useCreateChannel(scope, scopeId);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.roleLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [contacts, contactSearch]);

  const otherContacts = useMemo(
    () => filteredContacts.filter((c) => c.id !== currentActorId),
    [filteredContacts, currentActorId],
  );

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleStartDirect = async (targetActorId: string) => {
    await createDirect.mutateAsync(targetActorId);
    onOpenChange(false);
    setContactSearch("");
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createChannel.mutateAsync({
      type: channelType,
      name: name.trim(),
      topic: topic.trim() || undefined,
      description: description.trim() || undefined,
      memberIds: selectedMemberIds,
    });
    setName("");
    setTopic("");
    setDescription("");
    setSelectedMemberIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            {scope === "platform"
              ? "Start a direct message with another operator or create an internal staff channel."
              : "Message a workspace teammate directly or create a shared channel."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="mt-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
            <TabsTrigger value="channel">Create Channel</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="mt-3 space-y-3">
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="pl-8"
              />
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Loading directory...
                </p>
              ) : filteredContacts.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No matching people found.
                </p>
              ) : (
                filteredContacts.map((person) => {
                  const isOnline = presenceOverrides[`${scope}:${person.id}`] ?? person.isOnline;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      disabled={createDirect.isPending}
                      onClick={() => void handleStartDirect(person.id)}
                      className="hover:bg-muted flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            {person.avatarUrl && (
                              <AvatarImage
                                src={resolveStorageUrl(person.avatarUrl)}
                                alt={person.displayName}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials(person.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "border-background absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2",
                              isOnline ? "bg-emerald-500" : "bg-muted-foreground/40",
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">
                              {person.displayName}
                            </span>
                            {person.id === currentActorId && (
                              <Badge variant="outline" className="text-[10px]">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground truncate text-xs">{person.email}</p>
                        </div>
                      </div>
                      {person.roleLabel && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {person.roleLabel}
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="channel" className="mt-3">
            <form onSubmit={(e) => void handleCreateChannel(e)} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "PUBLIC", label: "Public", icon: HashIcon },
                    { value: "PRIVATE", label: "Private", icon: LockIcon },
                    { value: "GROUP", label: "Group", icon: UsersIcon },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const selected = channelType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChannelType(opt.value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chat-channel-name">Name</Label>
                <Input
                  id="chat-channel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. incident-response or product-launch"
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chat-channel-topic">Topic (optional)</Label>
                <Input
                  id="chat-channel-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is this channel focused on?"
                  maxLength={255}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chat-channel-desc">Description (optional)</Label>
                <Textarea
                  id="chat-channel-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Guidelines or context for members..."
                  rows={2}
                  maxLength={1000}
                />
              </div>

              {otherContacts.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Invite Members ({selectedMemberIds.length} selected)</Label>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border p-1.5">
                    {otherContacts.map((person) => {
                      const checked = selectedMemberIds.includes(person.id);
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => toggleMember(person.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                            checked ? "bg-primary/10 text-foreground" : "hover:bg-muted",
                          )}
                        >
                          <span className="truncate font-medium">
                            {person.displayName}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({person.email})
                            </span>
                          </span>
                          {checked && <CheckIcon className="text-primary h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || createChannel.isPending}>
                  {createChannel.isPending ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
