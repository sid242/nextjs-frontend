"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  ControlledCheckbox,
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

import { useCreatePlan } from "../queries";
import { createPlanSchema, type CreatePlanInput } from "../schemas";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlanDialog({ open, onOpenChange }: CreatePlanDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const { mutateAsync: createNewPlan, isPending } = useCreatePlan();

  const methods = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      key: "",
      name: "",
      description: "",
      priceCents: 4900,
      currency: "USD",
      billingInterval: "MONTHLY",
      isActive: true,
      isPublic: true,
      entitlements: {
        maxMembers: 25,
        maxProjects: 100,
        maxStorageMb: 20480, // 20 GB
        hasCustomRoles: true,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: false,
        hasAuditRetentionDays: 60,
      },
    },
  });

  const intervalOptions = [
    { label: "Monthly", value: "MONTHLY" },
    { label: "Annual", value: "ANNUAL" },
    { label: "Lifetime", value: "LIFETIME" },
  ];

  const onSubmit = async (values: CreatePlanInput) => {
    setFormError(null);
    try {
      await createNewPlan({
        ...values,
        key: values?.key?.toUpperCase?.()?.trim?.() ?? "",
        name: values?.name?.trim?.() ?? "",
        priceCents: Number(values?.priceCents ?? 0),
        entitlements: values?.entitlements
          ? {
              ...values.entitlements,
              maxMembers: Number(values.entitlements.maxMembers),
              maxProjects: Number(values.entitlements.maxProjects),
              maxStorageMb: Number(values.entitlements.maxStorageMb),
              hasAuditRetentionDays: Number(values.entitlements.hasAuditRetentionDays),
            }
          : undefined,
      });
      methods.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create SaaS plan"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="text-primary h-5 w-5" />
            Provision New SaaS Tier
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure commercial pricing and automated entitlement boundaries.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ControlledInput
              name="key"
              label="Unique Tier Key"
              placeholder="e.g. SCALE_UP"
              required
              className="h-9 font-mono text-xs uppercase"
            />
            <ControlledInput
              name="name"
              label="Display Plan Name"
              placeholder="e.g. Scale Up Tier"
              required
              className="h-9 text-xs"
            />
          </div>

          <ControlledTextarea
            name="description"
            label="Plan Description"
            placeholder="Commercial summary of this plan's ideal customer profile"
            className="h-16 resize-none text-xs"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ControlledInput
              name="priceCents"
              label="Price (Cents)"
              type="number"
              placeholder="e.g. 4900 ($49.00)"
              required
              className="h-9 font-mono text-xs"
            />
            <ControlledSelect
              name="billingInterval"
              label="Billing Interval"
              options={intervalOptions}
              returnPrimitiveValue
              required
            />
            <ControlledInput
              name="currency"
              label="Currency"
              placeholder="USD"
              required
              className="h-9 font-mono text-xs uppercase"
            />
          </div>

          <div className="border-border/60 bg-muted/20 space-y-3 rounded-xl border p-4">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Entitlement Capacity Limits
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ControlledInput
                name="entitlements.maxMembers"
                label="Seat Limit (Members)"
                type="number"
                placeholder="25"
                required
                className="h-9 font-mono text-xs"
              />
              <ControlledInput
                name="entitlements.maxProjects"
                label="Max Projects"
                type="number"
                placeholder="100"
                required
                className="h-9 font-mono text-xs"
              />
              <ControlledInput
                name="entitlements.maxStorageMb"
                label="Storage Quota (MB)"
                type="number"
                placeholder="20480 (20GB)"
                required
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <ControlledCheckbox name="entitlements.hasCustomRoles" label="Custom Dynamic RBAC" />
              <ControlledCheckbox
                name="entitlements.hasAdvancedAnalytics"
                label="Advanced Analytics"
              />
              <ControlledCheckbox
                name="entitlements.hasPrioritySupport"
                label="24/7 Priority SLA"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingText="Provisioning Tier..."
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Provision Plan
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
