"use client";

import { useState } from "react";
import { LifeBuoy, Loader2, MessageSquare, Plus, RefreshCw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useActiveTenant } from "@/features/tenants";
import { formatDateTime } from "@/lib/format";

import {
  useAddTicketMessage,
  useCreateTicket,
  useTenantTickets,
  useTicketDetails,
} from "../queries";
import type { TicketCategory, TicketPriority } from "../types";

export function SupportTicketsCard() {
  const { activeTenantId } = useActiveTenant();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Create form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("TECHNICAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  // Reply message state
  const [replyText, setReplyText] = useState("");

  const { data: tickets = [], isLoading, refetch } = useTenantTickets(activeTenantId);

  const { data: ticketDetails, isLoading: isDetailsLoading } = useTicketDetails(
    activeTenantId,
    selectedTicketId,
  );

  const createMutation = useCreateTicket(activeTenantId);
  const addMessageMutation = useAddTicketMessage(activeTenantId, selectedTicketId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      await createMutation.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        metadata: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
          url: typeof window !== "undefined" ? window.location.href : "Unknown",
        },
      });
      setSubject("");
      setDescription("");
      setIsCreateOpen(false);
    } catch {
      // handled by react query
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      await addMessageMutation.mutateAsync({
        message: replyText.trim(),
      });
      setReplyText("");
    } catch {
      // handled by react query
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <LifeBuoy className="text-primary size-4" /> Support Tickets
            </CardTitle>
            <CardDescription className="text-xs">
              Direct assistance from our technical engineering and billing operations team.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs">
              <RefreshCw className="mr-1 size-3.5" /> Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="mr-1 size-3.5" /> New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle className="text-base">Submit Support Ticket</DialogTitle>
                    <DialogDescription className="text-xs">
                      Describe the issue you are experiencing. Diagnostics will be automatically
                      attached.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3.5 py-4">
                    <div className="space-y-1">
                      <Label htmlFor="subject" className="text-xs">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Brief summary of the issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="category" className="text-xs">
                          Category
                        </Label>
                        <Select
                          value={category}
                          onValueChange={(val) => setCategory(val as TicketCategory)}
                        >
                          <SelectTrigger id="category" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GENERAL" className="text-xs">
                              General Inquiry
                            </SelectItem>
                            <SelectItem value="TECHNICAL" className="text-xs">
                              Technical / API
                            </SelectItem>
                            <SelectItem value="BILLING" className="text-xs">
                              Plans & Billing
                            </SelectItem>
                            <SelectItem value="SECURITY" className="text-xs">
                              Security & Access
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="priority" className="text-xs">
                          Priority
                        </Label>
                        <Select
                          value={priority}
                          onValueChange={(val) => setPriority(val as TicketPriority)}
                        >
                          <SelectTrigger id="priority" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW" className="text-xs">
                              Low (Minor)
                            </SelectItem>
                            <SelectItem value="MEDIUM" className="text-xs">
                              Medium (Standard)
                            </SelectItem>
                            <SelectItem value="HIGH" className="text-xs">
                              High (Degraded)
                            </SelectItem>
                            <SelectItem value="URGENT" className="text-xs">
                              Urgent (Outage)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-xs">
                        Details
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Please include error messages, steps to reproduce, or affected resources."
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createMutation.isPending || !subject.trim() || !description.trim()}
                      className="text-xs"
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-1.5 size-3 animate-spin" />
                      )}
                      Submit Ticket
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              No support tickets found. Click &quot;New Ticket&quot; if you need technical or
              billing assistance.
            </p>
          ) : (
            <div className="border-border/60 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Reference</TableHead>
                    <TableHead className="text-xs font-semibold">Subject</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold">Priority</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-foreground font-mono text-xs font-medium">
                        {t.ticketRef}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-medium">
                        {t.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.priority === "URGENT" || t.priority === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                          className="font-mono text-[10px]"
                        >
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === "OPEN"
                              ? "default"
                              : t.status === "RESOLVED"
                                ? "secondary"
                                : "outline"
                          }
                          className="font-mono text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicketId(t.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <MessageSquare className="mr-1 size-3" /> View Thread
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details & Thread Sheet */}
      <Sheet
        open={Boolean(selectedTicketId)}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
      >
        <SheetContent className="flex h-full flex-col sm:max-w-xl">
          <SheetHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-xs font-semibold">
                {ticketDetails?.ticket?.ticketRef}
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {ticketDetails?.ticket?.status}
              </Badge>
            </div>
            <SheetTitle className="text-base font-semibold">
              {ticketDetails?.ticket?.subject}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Opened on{" "}
              {ticketDetails?.ticket ? formatDateTime(ticketDetails.ticket.createdAt) : ""}
            </SheetDescription>
          </SheetHeader>

          {isDetailsLoading ? (
            <div className="flex-1 space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto py-4 pr-1">
              {ticketDetails?.messages?.map((msg) => {
                const isStaff = msg.senderType === "STAFF";
                return (
                  <div
                    key={msg.id}
                    className={`space-y-1.5 rounded-lg p-3 text-xs ${
                      isStaff
                        ? "bg-primary/10 border-primary/20 mr-4 border"
                        : "bg-muted/40 border-border/50 ml-4 border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-semibold">
                        {isStaff ? "Support Engineer" : (msg.senderName ?? "You")}
                      </span>
                      <span className="text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{msg.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {ticketDetails?.ticket?.status !== "CLOSED" && (
            <form onSubmit={handleSendReply} className="flex gap-2 border-t pt-3">
              <Textarea
                placeholder="Type a message or response..."
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="resize-none text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={addMessageMutation.isPending || !replyText.trim()}
                className="h-8 self-end text-xs"
              >
                {addMessageMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
