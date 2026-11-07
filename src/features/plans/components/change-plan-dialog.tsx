"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  loadRazorpayScript,
  useCreateCheckoutOrder,
  useVerifyOrderPayment,
  type RazorpayPaymentSuccessResponse,
} from "@/features/billing";
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
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const { data: plans = [], isLoading: isLoadingPlans } = usePublicPlans();
  const { mutateAsync: changeSub, isPending: isChangingFree } = useChangeSubscription();
  const { mutateAsync: createCheckoutOrder } = useCreateCheckoutOrder();
  const { mutateAsync: verifyOrderPayment } = useVerifyOrderPayment();

  const methods = useForm<ChangeSubscriptionInput>({
    resolver: zodResolver(changeSubscriptionSchema),
    defaultValues: {
      planKey: currentPlanKey ?? "PRO",
      seatCount: 1,
    },
  });

  const selectedPlanKey = methods.watch("planKey");
  const selectedPlan = plans.find((p: Plan) => p?.key === selectedPlanKey);
  const isTargetFree = selectedPlanKey === "FREE" || (selectedPlan?.priceCents ?? 0) === 0;

  const planOptions = (plans ?? []).map((p: Plan) => {
    const isFree = (p?.priceCents ?? 0) === 0 || p?.key === "FREE";
    const monthlyPrice = (p?.priceCents ?? 0) / 100;
    const priceDisplay = isFree
      ? "Free"
      : billingInterval === "ANNUAL"
        ? `₹${(monthlyPrice * 10).toLocaleString()}/yr`
        : `₹${monthlyPrice.toLocaleString()}/mo`;

    return {
      label: `${p?.name} — ${priceDisplay}`,
      value: p?.key ?? "",
    };
  });

  const onSubmit = async (values: ChangeSubscriptionInput) => {
    setFormError(null);
    const targetKey = values?.planKey?.trim?.()?.toUpperCase() ?? "PRO";

    // 1. Free plan downgrade/switch
    if (targetKey === "FREE") {
      try {
        await changeSub({
          planKey: "FREE",
          seatCount: 1,
        });
        onOpenChange(false);
      } catch (err: unknown) {
        setFormError(getErrorMessage(err, "Failed to switch to Free plan"));
      }
      return;
    }

    // 2. Paid plan checkout with Razorpay
    setIsCheckoutProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay checkout gateway. Please check your network connection.",
        );
      }

      // Step A: Create order server-side
      const checkoutData = await createCheckoutOrder({
        planKey: targetKey,
        billingInterval,
      });

      // Step B: Launch standard Razorpay Checkout
      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        throw new Error("Razorpay SDK initialization failed");
      }

      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amountMinor,
        currency: checkoutData.currency || "INR",
        name: "SaaS Platform",
        description: `${checkoutData.planName} (${billingInterval}) Plan Purchase`,
        order_id: checkoutData.orderId,
        handler: async (response: RazorpayPaymentSuccessResponse) => {
          try {
            const orderId = response?.razorpay_order_id ?? checkoutData.orderId;
            // Step C: Server-side signature verification & entitlement activation
            await verifyOrderPayment({
              razorpay_order_id: orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setVerificationSuccess(true);
            setTimeout(() => {
              setIsCheckoutProcessing(false);
              setVerificationSuccess(false);
              onOpenChange(false);
            }, 1200);
          } catch (verifyErr: unknown) {
            setIsCheckoutProcessing(false);
            setFormError(getErrorMessage(verifyErr, "Payment confirmation failed on server"));
          }
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => {
            setIsCheckoutProcessing(false);
          },
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err: unknown) {
      setIsCheckoutProcessing(false);
      setFormError(getErrorMessage(err, "Failed to initialize payment checkout"));
    }
  };

  const isPending = isChangingFree || isCheckoutProcessing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="text-primary h-5 w-5" />
            Upgrade or Modify Workspace Tier
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select a plan tier. Paid tiers use secure Razorpay Checkout for instant entitlement
            activation.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {verificationSuccess ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs font-semibold">
                Payment verified successfully! Workspace entitlements activated.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Billing Interval Selector */}
          {!isTargetFree ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Billing Interval</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingInterval("MONTHLY")}
                  className={`rounded-xl border p-2.5 text-center text-xs transition-colors ${
                    billingInterval === "MONTHLY"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border/60 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  Monthly Billing
                </button>

                <button
                  type="button"
                  onClick={() => setBillingInterval("ANNUAL")}
                  className={`relative rounded-xl border p-2.5 text-center text-xs transition-colors ${
                    billingInterval === "ANNUAL"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border/60 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    Annual Billing
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                      Save 17%
                    </span>
                  </span>
                </button>
              </div>
            </div>
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

          <div className="border-border/60 bg-muted/30 text-muted-foreground space-y-1 rounded-xl border p-3 text-xs">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Secure Checkout & Immediate Activation
            </div>
            <p className="text-[11px] leading-relaxed">
              Payments are processed via Razorpay. Entitlements update immediately upon backend
              cryptographic signature verification.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
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
              size="sm"
              pending={isPending}
              pendingText={verificationSuccess ? "Activating..." : "Processing..."}
            >
              {isTargetFree ? "Switch to Free" : "Proceed to Checkout"}
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
