"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BanIcon, MegaphoneIcon, PlayIcon, PlusIcon, UsersIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import {
  useCancelCampaignMutation,
  useCreateCampaignMutation,
  useScheduleCampaignMutation,
  whatsAppCampaignsQueryOptions,
  whatsAppPhoneNumbersQueryOptions,
  whatsAppTemplatesQueryOptions,
} from "../queries";
import type { WhatsAppCampaign } from "../types";

export function WhatsAppCampaignsTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: campaigns = [], isLoading } = useQuery(whatsAppCampaignsQueryOptions());
  const { data: templatesData } = useQuery(whatsAppTemplatesQueryOptions({ status: "APPROVED" }));
  const templates = templatesData?.items ?? [];
  const { data: phoneNumbers = [] } = useQuery(whatsAppPhoneNumbersQueryOptions());

  const createMutation = useCreateCampaignMutation();
  const scheduleMutation = useScheduleCampaignMutation();
  const cancelMutation = useCancelCampaignMutation();

  const handleCreate = async () => {
    if (!name.trim() || !templateId || !recipientsText.trim()) return;

    const recipients = recipientsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    await createMutation.mutateAsync({
      name: name.trim(),
      templateId,
      phoneNumberId: phoneNumberId || undefined,
      recipients: recipients.map((phone) => ({ phoneNumber: phone })),
    });

    setCreateDialogOpen(false);
    setName("");
    setTemplateId("");
    setPhoneNumberId("");
    setRecipientsText("");
  };

  const handleSchedule = async () => {
    if (!selectedCampaign) return;
    await scheduleMutation.mutateAsync({
      id: selectedCampaign.id,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
    setScheduleDialogOpen(false);
    setSelectedCampaign(null);
    setScheduledAt("");
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  const getStatusBadge = (status: WhatsAppCampaign["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
          >
            Completed
          </Badge>
        );
      case "SENDING":
        return (
          <Badge
            variant="outline"
            className="border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20"
          >
            Sending
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge
            variant="outline"
            className="border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/20"
          >
            Scheduled
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="border-muted text-muted-foreground">
            Draft
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/20"
          >
            Cancelled
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
            <CardTitle>WhatsApp Broadcast Campaigns</CardTitle>
            <CardDescription>
              Launch marketing and promotional announcements to opted-in customers using approved
              WhatsApp templates.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Create Campaign
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Loading broadcast campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              <MegaphoneIcon className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
              No campaigns created yet. Click above to create your first broadcast campaign.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Accepted</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Scheduled / Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell>{getStatusBadge(camp.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <UsersIcon className="text-muted-foreground h-3.5 w-3.5" />
                        <span>{camp.totalRecipients}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{camp.acceptedCount}</TableCell>
                    <TableCell className="text-muted-foreground">{camp.deliveredCount}</TableCell>
                    <TableCell className="font-medium text-sky-600">{camp.readCount}</TableCell>
                    <TableCell className="text-rose-600">{camp.failedCount}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {camp.scheduledAt
                        ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString()}`
                        : new Date(camp.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      {camp.status === "DRAFT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(camp);
                            setScheduleDialogOpen(true);
                          }}
                          className="h-8 gap-1"
                        >
                          <PlayIcon className="h-3.5 w-3.5" />
                          Launch / Schedule
                        </Button>
                      )}
                      {(camp.status === "SCHEDULED" || camp.status === "DRAFT") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(camp.id)}
                          className="text-destructive hover:text-destructive h-8 gap-1"
                        >
                          <BanIcon className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create Broadcast Campaign</DialogTitle>
            <DialogDescription>
              Configure an outbound broadcast campaign. Meta requires an approved template for
              broadcasts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g. Black Friday Special VIP Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Approved WhatsApp Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an approved template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Recipient Phone Numbers (E.164, one per line or comma-separated)</Label>
              <Textarea
                placeholder="+14155552671&#10;+919876543210&#10;+447911123456"
                rows={5}
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
              />
              <p className="text-muted-foreground text-[11px]">
                * Ensure all recipients have explicitly opted in to receive promotional messages to
                comply with WhatsApp Business Messaging Policies.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createMutation.isPending || !name.trim() || !templateId || !recipientsText.trim()
              }
            >
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Campaign Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Launch or Schedule Campaign</DialogTitle>
            <DialogDescription>
              Launch campaign immediately or set a future date and time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label>Scheduled Time (Leave empty to send immediately)</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Back
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending
                ? "Starting..."
                : scheduledAt
                  ? "Schedule"
                  : "Send Immediately"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
