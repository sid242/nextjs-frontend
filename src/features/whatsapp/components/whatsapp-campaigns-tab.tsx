"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { BanIcon, MegaphoneIcon, PlayIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { hasTenantPermission, useTenantContext } from "@/features/tenants";
import { getErrorMessage } from "@/lib/api/errors";

import {
  useCancelCampaignMutation,
  useCreateCampaignMutation,
  useScheduleCampaignMutation,
  whatsAppCampaignsQueryOptions,
  whatsAppPhoneNumbersQueryOptions,
  whatsAppTemplatesQueryOptions,
} from "../queries";
import {
  createCampaignSchema,
  scheduleCampaignFormSchema,
  splitCampaignRecipients,
  type CreateCampaignFormValues,
} from "../schemas";
import type { WhatsAppCampaign } from "../types";

const DEFAULT_SENDER = "default";

export function WhatsAppCampaignsTab() {
  const [dialog, setDialog] = useState<
    { kind: "create" } | { kind: "schedule"; id: string } | null
  >(null);
  const { data: context } = useTenantContext();
  const canCreate =
    hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_WRITE) &&
    hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.WHATSAPP_TEMPLATE_READ);
  const canSelectSender = hasTenantPermission(
    context?.permissions,
    TENANT_PERMISSIONS.WHATSAPP_PHONE_NUMBER_READ,
  );
  const canManage = hasTenantPermission(
    context?.permissions,
    TENANT_PERMISSIONS.WHATSAPP_CAMPAIGN_MANAGE,
  );
  const createOpen = dialog?.kind === "create" && canCreate;
  const scheduleOpen = dialog?.kind === "schedule" && canManage;
  const createForm = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: { name: "", templateId: "", phoneNumberId: DEFAULT_SENDER, recipients: "" },
  });
  const templateId = useWatch({ control: createForm?.control, name: "templateId" });

  const {
    data: campaigns = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(whatsAppCampaignsQueryOptions());
  const templatesQuery = useQuery({
    ...whatsAppTemplatesQueryOptions({ status: "APPROVED" }),
    enabled: createOpen,
  });
  const phoneNumbersQuery = useQuery({
    ...whatsAppPhoneNumbersQueryOptions(),
    enabled: createOpen && canSelectSender,
  });
  const templateOptions =
    templatesQuery?.data?.items?.map((template) => ({
      label: `${template?.name} (${template?.category})`,
      value: template?.id,
    })) ?? [];
  const accountId = templatesQuery?.data?.items?.find(
    (template) => template?.id === templateId,
  )?.businessAccountId;
  const senderOptions = [
    { label: "Use default sending number", value: DEFAULT_SENDER },
    ...(phoneNumbersQuery?.data
      ?.filter((phone) => phone?.isEnabled && phone?.businessAccountId === accountId)
      ?.map((phone) => ({
        label: phone?.displayPhoneNumber,
        value: phone?.phoneNumberId,
      })) ?? []),
  ];

  const createMutation = useCreateCampaignMutation();
  const scheduleMutation = useScheduleCampaignMutation();
  const cancelMutation = useCancelCampaignMutation();
  const scheduleForm = useForm({
    resolver: zodResolver(scheduleCampaignFormSchema),
    defaultValues: { scheduledAt: "" },
  });

  const createCampaign = async (values: CreateCampaignFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values?.name,
        templateId: values?.templateId,
        phoneNumberId:
          canSelectSender && values?.phoneNumberId !== DEFAULT_SENDER
            ? values?.phoneNumberId
            : undefined,
        recipients: splitCampaignRecipients(values?.recipients).map((phoneNumber) => ({
          phoneNumber,
        })),
      });
      setDialog(null);
    } catch (error) {
      createForm.setError("root", { message: getErrorMessage(error) });
    }
  };

  const scheduleCampaign = async ({ scheduledAt }: { scheduledAt: string }) => {
    if (dialog?.kind !== "schedule") return;
    try {
      await scheduleMutation.mutateAsync({
        id: dialog?.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      setDialog(null);
    } catch (error) {
      scheduleForm.setError("root", { message: getErrorMessage(error) });
    }
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
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>WhatsApp Broadcast Campaigns</CardTitle>
            <CardDescription>
              Launch marketing and promotional announcements to opted-in customers using approved
              WhatsApp templates.
            </CardDescription>
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                createForm.reset();
                setDialog({ kind: "create" });
              }}
              className="gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              Create Campaign
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {cancelMutation?.isError && (
            <p role="alert" className="text-destructive mb-4 text-sm">
              {getErrorMessage(cancelMutation?.error)}
            </p>
          )}
          {isError ? (
            <div role="alert" className="space-y-3 p-6 text-center text-sm">
              <p>Could not load campaigns.</p>
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Loading broadcast campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              <MegaphoneIcon className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
              No campaigns created yet.
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
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
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
                    {canManage && (
                      <TableCell className="space-x-2 text-right">
                        {camp.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              scheduleForm.reset();
                              setDialog({ kind: "schedule", id: camp.id });
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
                            disabled={cancelMutation?.isPending}
                            onClick={() => cancelMutation.mutate(camp.id)}
                            className="text-destructive hover:text-destructive h-8 gap-1"
                          >
                            <BanIcon className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open && !createMutation?.isPending) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-140">
          <DialogHeader>
            <DialogTitle>Create Broadcast Campaign</DialogTitle>
            <DialogDescription>
              Choose an approved template and enter the recipients for this draft.
            </DialogDescription>
          </DialogHeader>
          <FormWrapper methods={createForm} onSubmit={createCampaign}>
            <ControlledInput name="name" label="Campaign name" required />
            <ControlledSelect
              name="templateId"
              label="Approved WhatsApp template"
              options={templateOptions}
              returnPrimitiveValue
              isClearable={false}
              handleChange={() => createForm.resetField("phoneNumberId")}
              required
            />
            {templatesQuery?.isError && (
              <p role="alert" className="text-destructive text-sm">
                Could not load approved templates.
              </p>
            )}
            {templatesQuery?.isSuccess && templateOptions?.length === 0 && (
              <p className="text-muted-foreground text-sm">No approved templates are available.</p>
            )}
            {canSelectSender && (
              <ControlledSelect
                name="phoneNumberId"
                label="Sending phone number"
                options={senderOptions}
                returnPrimitiveValue
                isClearable={false}
              />
            )}
            <ControlledTextarea
              name="recipients"
              label="Recipient phone numbers"
              rows={5}
              description="Include each country code. Separate numbers by commas or new lines."
              required
            />
            {createForm?.formState?.errors?.root?.message && (
              <p role="alert" className="text-destructive text-sm">
                {createForm?.formState?.errors?.root?.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createMutation?.isPending}
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation?.isPending || templateOptions.length === 0}
              >
                Create Campaign
              </Button>
            </DialogFooter>
          </FormWrapper>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleOpen}
        onOpenChange={(open) => {
          if (!open && !scheduleMutation?.isPending) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle>Launch or Schedule Campaign</DialogTitle>
            <DialogDescription>
              Enter a time in your local timezone or leave it empty to send now.
            </DialogDescription>
          </DialogHeader>
          <FormWrapper methods={scheduleForm} onSubmit={scheduleCampaign}>
            <ControlledInput name="scheduledAt" label="Scheduled time" type="datetime-local" />
            {scheduleForm?.formState?.errors?.root?.message && (
              <p role="alert" className="text-destructive text-sm">
                {scheduleForm?.formState?.errors?.root?.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={scheduleMutation?.isPending}
                onClick={() => setDialog(null)}
              >
                Back
              </Button>
              <Button type="submit" disabled={scheduleMutation?.isPending}>
                Confirm
              </Button>
            </DialogFooter>
          </FormWrapper>
        </DialogContent>
      </Dialog>
    </div>
  );
}
