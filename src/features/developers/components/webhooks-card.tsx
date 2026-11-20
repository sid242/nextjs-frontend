"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  WebhookIcon,
  XCircleIcon,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveTenant } from "@/features/tenants";
import { formatDate } from "@/lib/format";

import {
  useCreateWebhookEndpoint,
  useDeleteWebhookEndpoint,
  useRedeliverWebhook,
  useRotateWebhookSecret,
  useSendTestWebhook,
  useWebhookDeliveries,
  useWebhookEndpoints,
} from "../queries";
import {
  createWebhookEndpointSchema,
  WEBHOOK_EVENTS,
  type CreateWebhookEndpointValues,
} from "../schemas";
import type { WebhookEndpointItem } from "../types";

export function WebhooksCard() {
  const { activeTenant } = useActiveTenant();
  const tenantId = activeTenant?.id;

  const { data, isLoading } = useWebhookEndpoints(tenantId);
  const createMutation = useCreateWebhookEndpoint(tenantId);
  const deleteMutation = useDeleteWebhookEndpoint(tenantId);
  const rotateSecretMutation = useRotateWebhookSecret(tenantId);
  const sendTestMutation = useSendTestWebhook(tenantId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [selectedEndpointForDeliveries, setSelectedEndpointForDeliveries] =
    useState<WebhookEndpointItem | null>(null);
  const [confirmDeleteEndpoint, setConfirmDeleteEndpoint] = useState<WebhookEndpointItem | null>(
    null,
  );

  const methods = useForm<CreateWebhookEndpointValues>({
    resolver: zodResolver(createWebhookEndpointSchema),
    defaultValues: {
      url: "",
      description: "",
      events: ["*"],
    },
  });

  const selectedEvents =
    useWatch({
      control: methods.control,
      name: "events",
    }) ?? [];

  const handleEventToggle = (eventValue: string, checked: boolean) => {
    const current = new Set(selectedEvents);
    if (checked) {
      current.add(eventValue);
    } else {
      current.delete(eventValue);
    }
    methods.setValue("events", Array.from(current), { shouldValidate: true });
  };

  const handleCreateSubmit = async (values: CreateWebhookEndpointValues) => {
    try {
      const res = await createMutation.mutateAsync(values);
      setCreatedSecret(res.secret);
      setCreateDialogOpen(false);
      methods.reset();
    } catch {
      // Handled by onError toast
    }
  };

  const handleRotateSecret = async (endpoint: WebhookEndpointItem) => {
    try {
      const res = await rotateSecretMutation.mutateAsync(endpoint.id);
      setCreatedSecret(res.secret);
    } catch {
      // Handled by onError toast
    }
  };

  const handleDelete = async (endpoint: WebhookEndpointItem) => {
    try {
      await deleteMutation.mutateAsync(endpoint.id);
      setConfirmDeleteEndpoint(null);
    } catch {
      // Handled by onError toast
    }
  };

  const handleSendTest = async (endpoint: WebhookEndpointItem) => {
    try {
      await sendTestMutation.mutateAsync(endpoint.id);
    } catch {
      // Handled by onError toast
    }
  };

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      toast.success("Signing secret copied to clipboard");
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const items = data?.items ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <WebhookIcon className="text-primary size-4" />
              Outbound Webhooks
            </CardTitle>
            <CardDescription className="text-xs">
              Broadcast real-time HTTP events to external web servers when resources change in your
              workspace.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <PlusIcon className="size-3.5" />
            Add Endpoint
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
              Loading webhook endpoints...
            </div>
          ) : items.length === 0 ? (
            <div className="border-border/60 flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <div className="bg-muted/60 rounded-full p-3">
                <WebhookIcon className="text-muted-foreground size-6" />
              </div>
              <h4 className="mt-3 text-sm font-medium">No webhook endpoints configured</h4>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                Set up an HTTPS endpoint to receive HMAC-signed event notifications when members,
                files, or billing change.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 gap-1.5"
              >
                <PlusIcon className="size-3.5" />
                Add your first endpoint
              </Button>
            </div>
          ) : (
            <div className="border-border/50 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Endpoint URL</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Subscribed Events</TableHead>
                    <TableHead className="text-xs">Failures</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="w-12 text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="max-w-xs font-mono text-xs">
                        <div className="truncate font-medium">{endpoint.url}</div>
                        {endpoint.description && (
                          <div className="text-muted-foreground truncate font-sans text-[11px]">
                            {endpoint.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {endpoint.status === "ACTIVE" ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                          >
                            <CheckCircle2Icon className="size-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-[10px]"
                          >
                            <XCircleIcon className="size-3" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {endpoint.events?.map((evt) => (
                            <Badge
                              key={evt}
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] font-normal"
                            >
                              {evt}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {endpoint.failureCount > 0 ? (
                          <span className="text-destructive font-semibold">
                            {endpoint.failureCount} failed
                          </span>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(endpoint.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreVerticalIcon className="size-3.5" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => setSelectedEndpointForDeliveries(endpoint)}
                              className="gap-2 text-xs"
                            >
                              <WebhookIcon className="size-3.5" />
                              View Deliveries
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendTest(endpoint)}
                              disabled={sendTestMutation.isPending}
                              className="gap-2 text-xs"
                            >
                              <SendIcon className="size-3.5" />
                              Send Test Ping
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRotateSecret(endpoint)}
                              className="gap-2 text-xs"
                            >
                              <KeyRoundIcon className="size-3.5" />
                              Rotate Secret
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmDeleteEndpoint(endpoint)}
                              className="text-destructive focus:text-destructive gap-2 text-xs"
                            >
                              <Trash2Icon className="size-3.5" />
                              Delete Endpoint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add Endpoint Dialog ──────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Webhook Endpoint</DialogTitle>
            <DialogDescription className="text-xs">
              Configure a destination URL to receive event payloads with HMAC-SHA256 signatures.
            </DialogDescription>
          </DialogHeader>

          <FormWrapper methods={methods} onSubmit={handleCreateSubmit} className="space-y-4">
            <ControlledInput
              name="url"
              label="Endpoint URL"
              placeholder="https://api.yourdomain.com/webhooks"
              required
            />

            <ControlledInput
              name="description"
              label="Description (Optional)"
              placeholder="e.g. Zapier lead ingestion, Customer sync"
            />

            <div className="space-y-2">
              <label className="text-xs font-medium">Subscribed Events</label>
              <div className="border-border/50 grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-3">
                {WEBHOOK_EVENTS.map((evt) => {
                  const isChecked = selectedEvents.includes(evt.value);
                  return (
                    <div key={evt.value} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`evt-${evt.value}`}
                        checked={isChecked}
                        onCheckedChange={(c) => handleEventToggle(evt.value, Boolean(c))}
                        className="mt-0.5"
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor={`evt-${evt.value}`}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {evt.label}
                        </label>
                        <p className="text-muted-foreground text-[11px]">{evt.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton size="sm" pending={createMutation.isPending} pendingText="Saving...">
                Create Endpoint
              </SubmitButton>
            </DialogFooter>
          </FormWrapper>
        </DialogContent>
      </Dialog>

      {/* ─── Secret Display Dialog (Shown Once) ───────────────────────────── */}
      <Dialog
        open={Boolean(createdSecret)}
        onOpenChange={(open) => {
          if (!open) setCreatedSecret(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <KeyRoundIcon className="size-5" />
            </div>
            <DialogTitle className="text-center text-base">Webhook Signing Secret</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Use this secret to verify signatures in the <code>X-Webhook-Signature</code> header.
              It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border/60 bg-muted/50 relative rounded-lg border p-3 font-mono text-xs break-all">
            {createdSecret}
          </div>

          <DialogFooter className="pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreatedSecret(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => createdSecret && copySecret(createdSecret)}
              className="gap-1.5"
            >
              {copiedSecret ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {copiedSecret ? "Copied" : "Copy Secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Deliveries Drawer ────────────────────────────────────────────── */}
      <Sheet
        open={Boolean(selectedEndpointForDeliveries)}
        onOpenChange={(open) => !open && setSelectedEndpointForDeliveries(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <WebhookIcon className="text-primary size-4" />
              Delivery History
            </SheetTitle>
            <SheetDescription className="truncate font-mono text-xs">
              {selectedEndpointForDeliveries?.url}
            </SheetDescription>
          </SheetHeader>

          {selectedEndpointForDeliveries && (
            <DeliveriesList tenantId={tenantId} endpointId={selectedEndpointForDeliveries.id} />
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Confirm Delete Dialog ────────────────────────────────────────── */}
      <Dialog
        open={Boolean(confirmDeleteEndpoint)}
        onOpenChange={(open) => !open && setConfirmDeleteEndpoint(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-destructive/10 text-destructive mx-auto flex size-10 items-center justify-center rounded-full">
              <AlertCircleIcon className="size-5" />
            </div>
            <DialogTitle className="text-center text-base">Delete Webhook Endpoint</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Are you sure you want to delete this endpoint? Outbound events will no longer be
              dispatched to this destination.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteEndpoint(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDeleteEndpoint && handleDelete(confirmDeleteEndpoint)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeliveriesList({ tenantId, endpointId }: { tenantId?: string; endpointId: string }) {
  const { data, isLoading, refetch } = useWebhookDeliveries(tenantId, endpointId);
  const redeliverMutation = useRedeliverWebhook(tenantId, endpointId);

  const deliveries = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
        Loading deliveries...
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-xs">No deliveries recorded yet.</p>
        <p className="text-muted-foreground mt-1 text-[11px]">
          Click &quot;Send Test Ping&quot; from the actions menu to verify delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>Recent Events ({deliveries.length})</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 gap-1 text-xs">
          <RefreshCwIcon className="size-3" />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="border-border/50 bg-card space-y-2 rounded-lg border p-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={delivery.deliveryStatus === "SUCCESS" ? "default" : "destructive"}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {delivery.deliveryStatus}
                </Badge>
                <code className="text-xs font-semibold">{delivery.event}</code>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {formatDate(delivery.createdAt)}
              </span>
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
              <span>
                HTTP Status: <strong>{delivery.httpStatus ?? "N/A"}</strong>
                {delivery.durationMs ? ` (${delivery.durationMs}ms)` : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1 px-2 text-[11px]"
                disabled={redeliverMutation.isPending}
                onClick={() => redeliverMutation.mutate(delivery.id)}
              >
                <RefreshCwIcon className="size-2.5" />
                Redeliver
              </Button>
            </div>

            {delivery.error && (
              <div className="bg-destructive/10 text-destructive rounded p-2 font-mono text-[10px] break-all">
                {delivery.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
