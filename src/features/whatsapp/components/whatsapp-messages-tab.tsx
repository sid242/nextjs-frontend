"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeftIcon, ArrowUpRightIcon, RefreshCwIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errors";

import {
  useSendTemplateMessageMutation,
  useSendTextMessageMutation,
  whatsAppMessagesQueryOptions,
  whatsAppPhoneNumbersQueryOptions,
  whatsAppTemplatesQueryOptions,
} from "../queries";
import type { WhatsAppMessage } from "../types";

export function WhatsAppMessagesTab() {
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"template" | "text">("template");

  // Form states
  const [phoneNumberId, setPhoneNumberId] = useState<string>("");
  const [to, setTo] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [param1, setParam1] = useState("");
  const [param2, setParam2] = useState("");
  const [param3, setParam3] = useState("");
  const [textContent, setTextContent] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery(whatsAppMessagesQueryOptions({ limit: 100 }));
  const { data: phoneNumbers = [] } = useQuery(whatsAppPhoneNumbersQueryOptions());
  const { data: templatesData } = useQuery(whatsAppTemplatesQueryOptions({ status: "APPROVED" }));
  const templates = templatesData?.items ?? [];
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const sendTemplateMutation = useSendTemplateMessageMutation();
  const sendTextMutation = useSendTextMessageMutation();

  const handleSend = async () => {
    if (!to.trim()) return;
    setSendError(null);

    try {
      if (composerMode === "template") {
        if (!selectedTemplate) return;
        const bodyParameters: string[] = [];
        if (param1) bodyParameters.push(param1);
        if (param2) bodyParameters.push(param2);
        if (param3) bodyParameters.push(param3);

        await sendTemplateMutation.mutateAsync({
          phoneNumberId: phoneNumberId || undefined,
          to: to.trim(),
          template: {
            name: selectedTemplate.name,
            language: selectedTemplate.language,
            components: bodyParameters.length
              ? [
                  {
                    type: "body",
                    parameters: bodyParameters.map((text) => ({ type: "text", text })),
                  },
                ]
              : undefined,
          },
        });
        toast.success("WhatsApp template message sent");
      } else {
        if (!textContent.trim()) return;
        await sendTextMutation.mutateAsync({
          phoneNumberId: phoneNumberId || undefined,
          to: to.trim(),
          text: textContent.trim(),
        });
        toast.success("WhatsApp text message sent");
      }

      setComposerOpen(false);
      setTo("");
      setSelectedTemplateId("");
      setTextContent("");
      setParam1("");
      setParam2("");
      setParam3("");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to send WhatsApp message");
      setSendError(msg);
      toast.error(msg);
    }
  };

  const getStatusBadge = (status: WhatsAppMessage["internalStatus"]) => {
    switch (status) {
      case "READ":
        return (
          <Badge
            variant="outline"
            className="border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/20"
          >
            Read
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
          >
            Delivered
          </Badge>
        );
      case "SENT":
      case "ACCEPTED":
        return (
          <Badge
            variant="outline"
            className="border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20"
          >
            {status === "SENT" ? "Sent" : "Accepted"}
          </Badge>
        );
      case "QUEUED":
        return (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
          >
            Queued
          </Badge>
        );
      case "FAILED":
        return (
          <Badge
            variant="outline"
            className="border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/20"
          >
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>WhatsApp Message Logs &amp; Composer</CardTitle>
            <CardDescription>
              Review all inbound and outbound WhatsApp communications, delivery receipts, and
              dispatch new messages.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setComposerOpen(true)} className="gap-1.5">
              <SendIcon className="h-4 w-4" />
              Compose Message
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Loading message records...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              No WhatsApp messages logged yet. Use the composer above to send your first message.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient / Sender</TableHead>
                  <TableHead>Content / Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider Msg ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>
                      {msg.direction === "OUTBOUND" ? (
                        <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                          <ArrowUpRightIcon className="h-3.5 w-3.5" />
                          <span>Outbound</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <ArrowDownLeftIcon className="h-3.5 w-3.5" />
                          <span>Inbound</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {msg.messageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{msg.contactId}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">
                      {msg.body || (msg.templateId ? `Template: ${msg.templateId}` : "—")}
                    </TableCell>
                    <TableCell>{getStatusBadge(msg.internalStatus)}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {msg.providerMessageId ? msg.providerMessageId.slice(0, 14) + "..." : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(msg.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Composer Dialog */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Dispatch an approved WhatsApp template or a free-form response within the 24-hour
              service window.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center">
              <Tabs
                value={composerMode}
                onValueChange={(val) => setComposerMode(val as "template" | "text")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">Approved Template</TabsTrigger>
                  <TabsTrigger value="text">Direct Text (24h Window)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-1">
              <Label>Sending Phone Number (Optional)</Label>
              <Select value={phoneNumberId} onValueChange={setPhoneNumberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Use Default Sending Number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers.map((p) => (
                    <SelectItem key={p.id} value={p.phoneNumberId}>
                      {p.displayPhoneNumber} {p.isDefault ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Recipient Phone Number (E.164 with Country Code)</Label>
              <Input
                placeholder="+14155552671 or +919876543210"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {composerMode === "template" ? (
              <div className="bg-muted/20 space-y-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <Label>Select Approved Template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.category}) - {tpl.language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    Template Body Variables (if template contains {"{{1}}"}, {"{{2}}"})
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="{{1}} value"
                      value={param1}
                      onChange={(e) => setParam1(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="{{2}} value"
                      value={param2}
                      onChange={(e) => setParam2(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="{{3}} value"
                      value={param3}
                      onChange={(e) => setParam3(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Enter message text... (Customer must have messaged you within the last 24 hours)"
                    rows={4}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                  />
                </div>
                <p className="text-muted-foreground text-[11px]">
                  * Note: Direct text messages can only be sent if the customer initiated contact
                  within 24 hours. Meta will reject outbound session messages outside this window.
                </p>
              </div>
            )}
          </div>

          {sendError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              {sendError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendTemplateMutation.isPending ||
                sendTextMutation.isPending ||
                !to.trim() ||
                (composerMode === "template" && !selectedTemplate) ||
                (composerMode === "text" && !textContent.trim())
              }
            >
              {sendTemplateMutation.isPending || sendTextMutation.isPending
                ? "Sending..."
                : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
