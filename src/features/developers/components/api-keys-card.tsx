"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  KeyIcon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveTenant } from "@/features/tenants";
import { formatDate } from "@/lib/format";

import { useApiKeys, useCreateApiKey, useRevokeApiKey, useRotateApiKey } from "../queries";
import { API_KEY_SCOPES, createApiKeySchema, type CreateApiKeyValues } from "../schemas";
import type { ApiKeyItem } from "../types";

export function ApiKeysCard() {
  const { activeTenant } = useActiveTenant();
  const tenantId = activeTenant?.id;

  const { data, isLoading } = useApiKeys(tenantId);
  const createMutation = useCreateApiKey(tenantId);
  const rotateMutation = useRotateApiKey(tenantId);
  const revokeMutation = useRevokeApiKey(tenantId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmRevokeKey, setConfirmRevokeKey] = useState<ApiKeyItem | null>(null);
  const [confirmRotateKey, setConfirmRotateKey] = useState<ApiKeyItem | null>(null);

  const methods = useForm<CreateApiKeyValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      scopes: ["members:read", "files:read"],
      rateLimitPerMin: 60,
      allowedIps: "",
      expiresInDays: 365,
    },
  });

  const selectedScopes =
    useWatch({
      control: methods.control,
      name: "scopes",
    }) ?? [];

  const handleScopeToggle = (scopeValue: string, checked: boolean) => {
    const current = new Set(selectedScopes);
    if (checked) {
      current.add(scopeValue);
    } else {
      current.delete(scopeValue);
    }
    methods.setValue("scopes", Array.from(current), { shouldValidate: true });
  };

  const handleCreateSubmit = async (values: CreateApiKeyValues) => {
    try {
      const res = await createMutation.mutateAsync(values);
      setCreatedRawKey(res.rawKey);
      setCreateDialogOpen(false);
      methods.reset();
    } catch {
      // Handled by mutation onError toast
    }
  };

  const handleRotate = async (key: ApiKeyItem) => {
    try {
      const res = await rotateMutation.mutateAsync(key.id);
      setConfirmRotateKey(null);
      setCreatedRawKey(res.rawKey);
    } catch {
      // Handled by mutation onError toast
    }
  };

  const handleRevoke = async (key: ApiKeyItem) => {
    try {
      await revokeMutation.mutateAsync(key.id);
      setConfirmRevokeKey(null);
    } catch {
      // Handled by mutation onError toast
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error("Failed to copy key to clipboard");
    }
  };

  const items = data?.items ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyIcon className="text-primary size-4" />
              API Keys
            </CardTitle>
            <CardDescription className="text-xs">
              Manage developer access tokens for integrating programmatic agents and services.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <PlusIcon className="size-3.5" />
            Generate New Key
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
              Loading API keys...
            </div>
          ) : items.length === 0 ? (
            <div className="border-border/60 flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <div className="bg-muted/60 rounded-full p-3">
                <KeyIcon className="text-muted-foreground size-6" />
              </div>
              <h4 className="mt-3 text-sm font-medium">No API keys created</h4>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                Generate an API key to authenticate requests against the public <code>/v1</code>{" "}
                REST API.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 gap-1.5"
              >
                <PlusIcon className="size-3.5" />
                Create your first key
              </Button>
            </div>
          ) : (
            <div className="border-border/50 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Key Name</TableHead>
                    <TableHead className="text-xs">Token Identifier</TableHead>
                    <TableHead className="text-xs">Scopes</TableHead>
                    <TableHead className="text-xs">Rate Limit</TableHead>
                    <TableHead className="text-xs">Last Used</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="w-12 text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="text-xs font-medium">{key.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        <code>{key.prefix}••••••••</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes?.map((scope) => (
                            <Badge
                              key={scope}
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] font-normal"
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {key.rateLimitPerMin} req/min
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(key.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreVerticalIcon className="size-3.5" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => setConfirmRotateKey(key)}
                              className="gap-2 text-xs"
                            >
                              <RefreshCwIcon className="size-3.5" />
                              Rotate Key
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmRevokeKey(key)}
                              className="text-destructive focus:text-destructive gap-2 text-xs"
                            >
                              <Trash2Icon className="size-3.5" />
                              Revoke Key
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

      {/* ─── Create API Key Dialog ────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Generate API Key</DialogTitle>
            <DialogDescription className="text-xs">
              Create a secret API key to authenticate external systems and automated workflows.
            </DialogDescription>
          </DialogHeader>

          <FormWrapper methods={methods} onSubmit={handleCreateSubmit} className="space-y-4">
            <ControlledInput
              name="name"
              label="Key Name"
              placeholder="e.g. Production CI/CD, Agent Pipeline"
              required
            />

            <div className="space-y-2">
              <label className="text-xs font-medium">Access Scopes</label>
              <div className="border-border/50 grid gap-2 rounded-lg border p-3">
                {API_KEY_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.value);
                  return (
                    <div key={scope.value} className="flex items-start gap-2.5">
                      <Checkbox
                        id={`scope-${scope.value}`}
                        checked={isChecked}
                        onCheckedChange={(c) => handleScopeToggle(scope.value, Boolean(c))}
                        className="mt-0.5"
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor={`scope-${scope.value}`}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {scope.label}
                        </label>
                        <p className="text-muted-foreground text-[11px]">{scope.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ControlledInput
                name="rateLimitPerMin"
                label="Rate Limit (req/min)"
                type="number"
                min={10}
                max={1000}
              />
              <ControlledInput
                name="expiresInDays"
                label="Expires in (days)"
                type="number"
                min={0}
                max={730}
              />
            </div>

            <ControlledInput
              name="allowedIps"
              label="IP Whitelist (Optional)"
              placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                size="sm"
                pending={createMutation.isPending}
                pendingText="Generating..."
              >
                Generate Key
              </SubmitButton>
            </DialogFooter>
          </FormWrapper>
        </DialogContent>
      </Dialog>

      {/* ─── Raw Key Display Dialog (Shown Once) ───────────────────────────── */}
      <Dialog
        open={Boolean(createdRawKey)}
        onOpenChange={(open) => {
          if (!open) setCreatedRawKey(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <KeyIcon className="size-5" />
            </div>
            <DialogTitle className="text-center text-base">Save Your API Key</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Please copy your new API key now. For security purposes, you will not be able to view
              it again.
            </DialogDescription>
          </DialogHeader>

          <Alert
            variant="destructive"
            className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          >
            <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-semibold">Important Security Warning</AlertTitle>
            <AlertDescription className="text-xs">
              Never commit this token to source control or expose it in client-side code.
            </AlertDescription>
          </Alert>

          <div className="border-border/60 bg-muted/50 relative rounded-lg border p-3 font-mono text-xs break-all">
            {createdRawKey}
          </div>

          <DialogFooter className="pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreatedRawKey(null)}
            >
              I have stored it safely
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => createdRawKey && copyToClipboard(createdRawKey)}
              className="gap-1.5"
            >
              {copiedKey ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              {copiedKey ? "Copied" : "Copy API Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Rotate Dialog ────────────────────────────────────────── */}
      <Dialog
        open={Boolean(confirmRotateKey)}
        onOpenChange={(open) => !open && setConfirmRotateKey(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <RefreshCwIcon className="size-5" />
            </div>
            <DialogTitle className="text-center text-base">Rotate API Key</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Rotating key <strong>{confirmRotateKey?.name}</strong> will instantly invalidate the
              previous key. Any systems using the old token will be rejected immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmRotateKey(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={rotateMutation.isPending}
              onClick={() => confirmRotateKey && handleRotate(confirmRotateKey)}
            >
              {rotateMutation.isPending ? "Rotating..." : "Rotate Key Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Revoke Dialog ────────────────────────────────────────── */}
      <Dialog
        open={Boolean(confirmRevokeKey)}
        onOpenChange={(open) => !open && setConfirmRevokeKey(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-destructive/10 text-destructive mx-auto flex size-10 items-center justify-center rounded-full">
              <ShieldAlertIcon className="size-5" />
            </div>
            <DialogTitle className="text-center text-base">Revoke API Key</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Are you sure you want to revoke <strong>{confirmRevokeKey?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmRevokeKey(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={revokeMutation.isPending}
              onClick={() => confirmRevokeKey && handleRevoke(confirmRevokeKey)}
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
