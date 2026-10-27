"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit3, Power, PowerOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  ControlledCheckbox,
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

import { useUpdatePlan } from "../queries";
import { updatePlanSchema, type Plan, type UpdatePlanInput } from "../schemas";

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
}

const intervalOptions = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Annual", value: "ANNUAL" },
  { label: "Lifetime", value: "LIFETIME" },
];

export function EditPlanDialog({ open, onOpenChange, plan }: EditPlanDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const { mutateAsync: updatePlanMutation, isPending } = useUpdatePlan();

  const methods = useForm<UpdatePlanInput>({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      name: "",
      description: "",
      priceCents: 0,
      currency: "USD",
      billingInterval: "MONTHLY",
      isActive: true,
      isPublic: true,
      entitlements: {
        maxMembers: 5,
        maxProjects: 10,
        maxStorageMb: 1024,
        hasCustomRoles: false,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        hasAuditRetentionDays: 7,
      },
    },
  });

  useEffect(() => {
    if (plan && open) {
      methods.reset({
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        priceCents: plan?.priceCents ?? 0,
        currency: plan?.currency ?? "USD",
        billingInterval: plan?.billingInterval ?? "MONTHLY",
        isActive: plan?.isActive ?? true,
        isPublic: plan?.isPublic ?? true,
        entitlements: {
          maxMembers: plan?.entitlements?.maxMembers ?? 5,
          maxProjects: plan?.entitlements?.maxProjects ?? 10,
          maxStorageMb: plan?.entitlements?.maxStorageMb ?? 1024,
          hasCustomRoles: Boolean(plan?.entitlements?.hasCustomRoles),
          hasAdvancedAnalytics: Boolean(plan?.entitlements?.hasAdvancedAnalytics),
          hasPrioritySupport: Boolean(plan?.entitlements?.hasPrioritySupport),
          hasAuditRetentionDays: plan?.entitlements?.hasAuditRetentionDays ?? 7,
        },
      });
    }
  }, [plan, open, methods]);

  const onSubmit = async (values: UpdatePlanInput) => {
    if (!plan?.id) return;
    setFormError(null);
    try {
      await updatePlanMutation({
        id: plan.id,
        data: {
          ...values,
          name: values?.name?.trim?.() ?? "",
          description: values?.description?.trim?.() ?? "",
          priceCents: Number(values?.priceCents ?? 0),
          entitlements: values?.entitlements
            ? {
                maxMembers: Number(values.entitlements.maxMembers),
                maxProjects: Number(values.entitlements.maxProjects),
                maxStorageMb: Number(values.entitlements.maxStorageMb),
                hasAuditRetentionDays: Number(values.entitlements.hasAuditRetentionDays),
                hasCustomRoles: Boolean(values.entitlements.hasCustomRoles),
                hasAdvancedAnalytics: Boolean(values.entitlements.hasAdvancedAnalytics),
                hasPrioritySupport: Boolean(values.entitlements.hasPrioritySupport),
              }
            : undefined,
        },
      });
      toast.success(`Plan "${plan.name}" updated successfully`);
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to update SaaS plan"));
    }
  };

  const handleToggleActive = async () => {
    if (!plan?.id) return;
    const nextState = !plan.isActive;
    try {
      await updatePlanMutation({
        id: plan.id,
        data: {
          name: plan.name,
          description: plan.description ?? "",
          priceCents: plan.priceCents,
          currency: plan.currency,
          billingInterval: plan.billingInterval,
          isActive: nextState,
          isPublic: plan.isPublic,
          entitlements: plan.entitlements
            ? {
                maxMembers: plan.entitlements.maxMembers,
                maxProjects: plan.entitlements.maxProjects,
                maxStorageMb: plan.entitlements.maxStorageMb,
                hasAuditRetentionDays: plan.entitlements.hasAuditRetentionDays,
                hasCustomRoles: plan.entitlements.hasCustomRoles,
                hasAdvancedAnalytics: plan.entitlements.hasAdvancedAnalytics,
                hasPrioritySupport: plan.entitlements.hasPrioritySupport,
              }
            : undefined,
        },
      });
      toast.success(
        nextState
          ? `Plan "${plan.name}" has been activated.`
          : `Plan "${plan.name}" has been deactivated.`,
      );
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to change plan active status"));
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFormError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="text-primary h-5 w-5" />
              Edit SaaS Tier
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-xs uppercase">
              {plan?.key}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Modify pricing model, entitlement limits, and visibility for this SaaS tier.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {/* Readonly Tier Key & Status Overview */}
          <div className="bg-muted/30 border-border/60 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-muted-foreground text-[11px] font-medium uppercase">
                System Identifier
              </div>
              <div className="font-mono text-sm font-semibold">{plan?.key}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={plan?.isActive ? "destructive" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleToggleActive}
                disabled={isPending}
              >
                {plan?.isActive ? (
                  <>
                    <PowerOff className="h-3.5 w-3.5" /> Deactivate Tier
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5 text-emerald-500" /> Activate Tier
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ControlledInput
              name="name"
              label="Display Plan Name"
              placeholder="e.g. Scale Up Tier"
              required
              className="h-9 text-xs"
            />
            <ControlledSelect
              name="billingInterval"
              label="Billing Interval"
              options={intervalOptions}
              returnPrimitiveValue
              required
            />
          </div>

          <ControlledTextarea
            name="description"
            label="Plan Description"
            placeholder="Commercial summary of this plan's ideal customer profile"
            className="h-16 resize-none text-xs"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ControlledInput
              name="priceCents"
              label="Price (Cents)"
              type="number"
              placeholder="e.g. 4900 ($49.00)"
              required
              className="h-9 font-mono text-xs"
            />
            <ControlledInput
              name="currency"
              label="Currency"
              placeholder="USD"
              required
              className="h-9 font-mono text-xs uppercase"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <ControlledCheckbox name="isActive" label="Active (Can be subscribed to)" />
            <ControlledCheckbox name="isPublic" label="Public (Visible in pricing catalog)" />
          </div>

          {/* Entitlements Box */}
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
              pendingText="Saving Changes..."
              size="sm"
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
