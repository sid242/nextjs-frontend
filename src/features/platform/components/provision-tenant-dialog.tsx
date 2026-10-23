"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Sparkles } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api/errors";

import { useProvisionTenant } from "../queries";
import { provisionTenantSchema, type ProvisionTenantInput } from "../schemas";

interface ProvisionTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvisionTenantDialog({ open, onOpenChange }: ProvisionTenantDialogProps) {
  const { mutateAsync: provision, isPending } = useProvisionTenant();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<{
    tenantName: string;
    ownerEmail: string;
    inviteUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<ProvisionTenantInput>({
    resolver: zodResolver(provisionTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      ownerEmail: "",
      plan: "FREE",
      databaseMode: "shared",
      timezone: "UTC",
      notes: "",
    },
  });

  // Automatically derive URL slug from workspace name if not manually modified
  const nameValue = useWatch({ control: form.control, name: "name" });
  useEffect(() => {
    if (nameValue && !form.formState.dirtyFields.slug) {
      const derived = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", derived, { shouldValidate: true });
    }
  }, [nameValue, form]);

  const handleClose = () => {
    form.reset();
    setErrorMsg(null);
    setProvisionResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  const onSubmit = async (data: ProvisionTenantInput) => {
    setErrorMsg(null);
    try {
      const res = await provision(data);
      setProvisionResult({
        tenantName: res.tenant.name,
        ownerEmail: res.owner.email,
        inviteUrl: res.inviteUrl,
      });
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const copyToClipboard = async () => {
    if (provisionResult?.inviteUrl) {
      await navigator.clipboard.writeText(provisionResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-5" />
            Provision Workspace Organization
          </DialogTitle>
          <DialogDescription>
            Onboard a new customer tenant organization. An initial owner invitation and subscription
            trial will be created automatically.
          </DialogDescription>
        </DialogHeader>

        {provisionResult ? (
          <div className="space-y-4 py-2">
            <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="font-semibold">Workspace Provisioned Successfully</AlertTitle>
              <AlertDescription className="text-xs">
                Organization <strong>{provisionResult.tenantName}</strong> has been configured with
                default branding, permissions, and background invitation dispatch.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 rounded-lg border p-3.5">
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                Owner Magic-Link Invitation
              </span>
              <p className="text-muted-foreground text-xs">
                An invitation email was enqueued for <strong>{provisionResult.ownerEmail}</strong>.
                You may also share this single-use onboarding URL directly:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <code className="bg-muted flex-1 truncate rounded px-2.5 py-1.5 font-mono text-xs">
                  {provisionResult.inviteUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <FormWrapper methods={form} onSubmit={onSubmit} className="space-y-4 py-1">
            {errorMsg && (
              <Alert variant="destructive" className="py-2 text-xs">
                {errorMsg}
              </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <ControlledInput
                name="name"
                label="Organization Name"
                placeholder="e.g. Acme Corporation"
                required
              />
              <ControlledInput
                name="slug"
                label="URL Slug (Identifier)"
                placeholder="e.g. acme-corp"
                required
              />
            </div>

            <ControlledInput
              name="ownerEmail"
              label="Primary Owner Email"
              type="email"
              placeholder="e.g. founder@acme.com"
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ControlledSelect
                name="plan"
                label="Subscription Tier"
                returnPrimitiveValue
                options={[
                  { label: "Free Workspace (Default)", value: "FREE" },
                  { label: "Starter Tier", value: "STARTER" },
                  { label: "Pro / Growth Tier", value: "PRO" },
                  { label: "Enterprise Tier", value: "ENTERPRISE" },
                ]}
              />

              <ControlledSelect
                name="databaseMode"
                label="Database Architecture"
                returnPrimitiveValue
                options={[
                  { label: "Shared Multi-Tenant (Standard)", value: "shared" },
                  { label: "Dedicated Database (Enterprise)", value: "dedicated" },
                ]}
              />
            </div>

            <ControlledInput
              name="notes"
              label="Internal Operator Notes (Optional)"
              placeholder="e.g. Inbound POC from enterprise sales queue"
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <SubmitButton pending={isPending} pendingText="Provisioning Organization…">
                Provision Workspace
              </SubmitButton>
            </DialogFooter>
          </FormWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
