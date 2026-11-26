"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CheckCheckIcon,
  ClockIcon,
  MessageSquareIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSocket, useSocketEvent } from "@/features/realtime";
import { useActiveTenant } from "@/features/tenants";

import { whatsappKeys } from "../keys";
import {
  useReplyConversationMutation,
  whatsAppConversationMessagesQueryOptions,
  whatsAppConversationsQueryOptions,
} from "../queries";
import type { WhatsAppMessage } from "../types";

export function WhatsAppConversationsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery(
    whatsAppConversationsQueryOptions(statusFilter === "all" ? undefined : statusFilter),
  );

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) || conversations[0];
  const activeConversationId = selectedConversation?.id;

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery(
    whatsAppConversationMessagesQueryOptions(activeConversationId),
  );

  const replyMutation = useReplyConversationMutation(activeConversationId || "");
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { activeTenant } = useActiveTenant();

  // Join dedicated WhatsApp room for the active tenant
  useEffect(() => {
    if (!socket || !activeTenant?.id) return;
    const roomId = `tenant:${activeTenant.id}:whatsapp`;
    socket.emit("room:join", { roomId });
    return () => {
      socket.emit("room:leave", { roomId });
    };
  }, [socket, activeTenant?.id]);

  // Real-time inbound messages: instantly refresh conversations and active thread
  useSocketEvent("whatsapp:message:received", (payload) => {
    queryClient.invalidateQueries({ queryKey: whatsappKeys.conversations() });
    if (payload.conversationId) {
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationMessages(payload.conversationId),
      });
    }
  });

  // Real-time status updates: refresh message bubbles
  useSocketEvent("whatsapp:status:updated", () => {
    if (activeConversationId) {
      queryClient.invalidateQueries({
        queryKey: whatsappKeys.conversationMessages(activeConversationId),
      });
    }
    queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
  });

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConversationId) return;
    try {
      await replyMutation.mutateAsync(replyText.trim());
      setReplyText("");
    } catch {
      // Error handled by mutation
    }
  };

  const isWindowActive = selectedConversation?.customerServiceWindowExpiresAt
    ? new Date(selectedConversation.customerServiceWindowExpiresAt) > new Date()
    : false;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-muted/20 border-b px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Customer Conversations Inbox</CardTitle>
            <CardDescription>
              Manage real-time 2-way customer inquiries within Meta&apos;s 24-hour customer service
              window.
            </CardDescription>
          </div>
          <div className="w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conversations</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <div className="grid h-[640px] grid-cols-1 md:grid-cols-12">
        {/* Left pane: Conversation List */}
        <div className="flex flex-col border-r md:col-span-4 lg:col-span-4">
          <div className="overflow-y-auto">
            {isLoadingConversations ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-sm">
                <MessageSquareIcon className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                No WhatsApp conversations found.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = (selectedConversationId || conversations[0]?.id) === conv.id;
                const windowOpen = conv.customerServiceWindowExpiresAt
                  ? new Date(conv.customerServiceWindowExpiresAt) > new Date()
                  : false;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`hover:bg-muted/50 w-full border-b p-4 text-left transition-colors ${
                      isSelected ? "bg-muted/80" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">
                            {conv.contactName || conv.contactPhone || "WhatsApp User"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {conv.contactPhone || conv.contactId}
                          </div>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 px-1.5 text-xs font-semibold">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <Badge
                        variant="outline"
                        className={
                          windowOpen
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                            : "border-muted text-muted-foreground"
                        }
                      >
                        {windowOpen ? "Window Active" : "Window Expired"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Active Conversation & Reply */}
        <div className="flex flex-col md:col-span-8 lg:col-span-8">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="bg-card flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {selectedConversation.contactName ||
                        selectedConversation.contactPhone ||
                        "WhatsApp Customer"}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {selectedConversation.contactPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isWindowActive ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                      <ClockIcon className="mr-1 h-3.5 w-3.5" />
                      24h Window Open
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      <AlertCircleIcon className="mr-1 h-3.5 w-3.5" />
                      Window Closed (Template Required)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="bg-muted/10 flex-1 space-y-3 overflow-y-auto p-4">
                {isLoadingMessages ? (
                  <div className="text-muted-foreground p-8 text-center text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center text-sm">
                    No messages in this conversation thread yet.
                  </div>
                ) : (
                  messages.map((msg: WhatsAppMessage) => {
                    const isOutbound = msg.direction === "OUTBOUND";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-xs ${
                            isOutbound
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-card text-card-foreground rounded-bl-xs border"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {msg.body || `[${msg.messageType}]`}
                          </div>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span>{formatTime(msg.createdAt)}</span>
                            {isOutbound && (
                              <CheckCheckIcon
                                className={`h-3 w-3 ${
                                  msg.internalStatus === "READ"
                                    ? "text-sky-300"
                                    : "text-primary-foreground/70"
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Separator />

              {/* Footer Reply Composer */}
              <div className="bg-card p-4">
                {isWindowActive ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type a WhatsApp reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={replyMutation.isPending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={replyMutation.isPending || !replyText.trim()}>
                      <SendIcon className="h-4 w-4" />
                      <span className="sr-only">Send reply</span>
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    <p className="font-medium">Meta 24-Hour Customer Service Window has expired.</p>
                    <p className="mt-0.5">
                      You cannot send free-form text messages. Send an approved template message
                      from the <strong>Compose &amp; Logs</strong> tab to re-open the conversation
                      window.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
              Select a conversation from the left to view messages.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
