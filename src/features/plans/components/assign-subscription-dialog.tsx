"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

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

import { useAssignSubscription, usePublicPlans } from "../queries";
import { assignSubscriptionSchema, type AssignSubscriptionInput, type Plan } from "../schemas";

interface AssignSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  tenantName?: string;
}

const INTERVAL_OPTIONS = [
  { label: "Monthly (Billed every month)", value: "MONTHLY" },
  { label: "Annual (Billed every 12 months)", value: "ANNUAL" },
  { label: "Lifetime (Single one-off charge)", value: "LIFETIME" },
];

export function AssignSubscriptionDialog({
  open,
  onOpenChange,
  tenantId = "",
  tenantName = "Workspace",
}: AssignSubscriptionDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const { data: plans = [], isLoading: isLoadingPlans } = usePublicPlans();
  const { mutateAsync: assignSub, isPending } = useAssignSubscription();

  const methods = useForm<AssignSubscriptionInput>({
    resolver: zodResolver(assignSubscriptionSchema),
    defaultValues: {
      tenantId: tenantId ?? "",
      planKey: "PRO",
      startDate: new Date().toISOString().split("T")[0],
      isTrial: false,
      trialEndsAt: "",
      billingInterval: "MONTHLY",
      billingEmail: "",
      seatCount: 5,
      prorate: false,
      internalNotes: "",
    },
  });

  const planOptions = (plans ?? []).map((p: Plan) => ({
    label: `${p?.name} — $${((p?.priceCents ?? 0) / 100).toFixed(0)}/mo (${p?.key})`,
    value: p?.key ?? "",
  }));

  const isTrial = useWatch({ control: methods.control, name: "isTrial" });

  const onSubmit = async (values: AssignSubscriptionInput) => {
    setFormError(null);
    try {
      await assignSub({
        tenantId: values.tenantId,
        planKey: values.planKey.trim(),
        startDate: values.startDate || undefined,
        isTrial: Boolean(values.isTrial),
        trialEndsAt: values.trialEndsAt || undefined,
        billingInterval: values.billingInterval,
        billingEmail: values.billingEmail ? values.billingEmail.trim() : undefined,
        seatCount: Number(values.seatCount ?? 1),
        prorate: Boolean(values.prorate),
        internalNotes: values.internalNotes ? values.internalNotes.trim() : undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to assign subscription to workspace"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            Provision Workspace Subscription
          </DialogTitle>
          <DialogDescription>
            Assign or override a subscription tier for <strong>{tenantName}</strong>. Platform staff
            operations are audited and reflected immediately.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
          <ControlledInput<AssignSubscriptionInput>
            name="tenantId"
            label="Tenant Identifier (UUID)"
            placeholder="00000000-0000-0000-0000-000000000000"
            disabled={Boolean(tenantId)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledSelect<AssignSubscriptionInput>
              name="planKey"
              label="Subscription Tier"
              options={
                planOptions.length > 0
                  ? planOptions
                  : [
                      { label: "Free Core (FREE)", value: "FREE" },
                      { label: "Pro Growth (PRO)", value: "PRO" },
                      { label: "Enterprise Scale (ENTERPRISE)", value: "ENTERPRISE" },
                    ]
              }
              disabled={isLoadingPlans}
            />

            <ControlledSelect<AssignSubscriptionInput>
              name="billingInterval"
              label="Billing Cadence"
              options={INTERVAL_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledInput<AssignSubscriptionInput>
              name="seatCount"
              label="Allocated Seats"
              type="number"
              min={1}
            />

            <ControlledInput<AssignSubscriptionInput>
              name="billingEmail"
              label="Billing Contact Email"
              type="email"
              placeholder="billing@organization.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ControlledInput<AssignSubscriptionInput>
              name="startDate"
              label="Effective Start Date"
              type="date"
            />

            {isTrial ? (
              <ControlledInput<AssignSubscriptionInput>
                name="trialEndsAt"
                label="Trial Expiration Date"
                type="date"
              />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <ControlledCheckbox<AssignSubscriptionInput>
              name="isTrial"
              label="Grant Trial Access"
              description="Temporarily enables full tier features without charge"
            />

            <ControlledCheckbox<AssignSubscriptionInput>
              name="prorate"
              label="Prorate Subscription Charges"
              description="Adjust subsequent invoice for mid-cycle changes"
            />
          </div>

          <ControlledTextarea<AssignSubscriptionInput>
            name="internalNotes"
            label="Internal Provisioning Note"
            placeholder="Reason for assignment, contracted terms, or account manager notes..."
            rows={2}
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton pending={isPending} pendingText="Assigning Tier...">
              <ShieldCheck className="mr-1.5 size-4" />
              Apply Subscription
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
