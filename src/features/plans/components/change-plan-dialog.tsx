"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledSelect, FormWrapper } from "@/components/molecules/forms";
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

import { useChangeSubscription, usePublicPlans } from "../queries";
import { changeSubscriptionSchema, type ChangeSubscriptionInput, type Plan } from "../schemas";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanKey?: string;
}

export function ChangePlanDialog({ open, onOpenChange, currentPlanKey }: ChangePlanDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const { data: plans = [], isLoading: isLoadingPlans } = usePublicPlans();
  const { mutateAsync: changeSub, isPending } = useChangeSubscription();

  const methods = useForm<ChangeSubscriptionInput>({
    resolver: zodResolver(changeSubscriptionSchema),
    defaultValues: {
      planKey: currentPlanKey ?? "GROWTH",
      seatCount: 1,
    },
  });

  const planOptions = (plans ?? []).map((p: Plan) => ({
    label: `${p?.name} — $${((p?.priceCents ?? 0) / 100).toFixed(0)}/mo (${p?.entitlements?.maxMembers ?? 5} seats)`,
    value: p?.key ?? "",
  }));

  const onSubmit = async (values: ChangeSubscriptionInput) => {
    setFormError(null);
    try {
      await changeSub({
        planKey: values?.planKey?.trim?.() ?? "",
        seatCount: Number(values?.seatCount ?? 1),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to update workspace subscription"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="text-primary h-5 w-5" />
            Modify Workspace Tier
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upgrade or change your organization&apos;s plan. Entitlements update immediately.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <ControlledSelect
            name="planKey"
            label="Target Plan"
            placeholder={isLoadingPlans ? "Loading plans..." : "Select plan tier"}
            options={planOptions}
            returnPrimitiveValue
            disabled={isLoadingPlans || isPending}
            required
          />

          <div className="border-border/60 bg-muted/30 text-muted-foreground space-y-1 rounded-lg border p-3 text-xs">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Instant Proration & Capacity Guarantee
            </div>
            <p className="text-[11px] leading-relaxed">
              If downgrading, your workspace team count must be within the target plan&apos;s seat
              capacity before switching.
            </p>
          </div>

          <DialogFooter className="pt-2">
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
              pendingText="Updating Subscription..."
              size="sm"
              className="gap-1.5"
            >
              Confirm Subscription Switch
              <ArrowRight className="h-3.5 w-3.5" />
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
