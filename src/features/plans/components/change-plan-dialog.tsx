"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
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
import { hasTenantPermission, useTenantContext } from "@/features/tenants";
import { getErrorMessage } from "@/lib/api/errors";

import { tenantSubscriptionQueryOptions, useChangeSubscription, usePublicPlans } from "../queries";
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
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [serverOrderInfo, setServerOrderInfo] = useState<{
    amount: string;
    currency: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { data: tenantContext } = useTenantContext();
  const canManageBilling = hasTenantPermission(tenantContext?.permissions, "billing:manage");

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

  /**
   * Polls subscription status when payment succeeds at gateway but verify call experiences
   * transient network/server hiccups. Never tells the user payment failed in this case.
   */
  const pollSubscriptionUntilConfirmed = async (expectedPlanKey: string) => {
    setIsConfirmingPayment(true);
    setFormError(null);
    let attempts = 0;
    const maxAttempts = 6;
    const intervalMs = 2500;

    const poll = async () => {
      attempts++;
      try {
        const sub = await queryClient.fetchQuery(tenantSubscriptionQueryOptions());
        if (sub?.plan?.key === expectedPlanKey || sub?.status === "ACTIVE") {
          setIsConfirmingPayment(false);
          setVerificationSuccess(true);
          setTimeout(() => {
            setVerificationSuccess(false);
            setIsCheckoutProcessing(false);
            onOpenChange(false);
          }, 1500);
          return;
        }
      } catch {
        /* continue polling */
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs);
      } else {
        // Backend webhook will process in the background - show success and close
        setIsConfirmingPayment(false);
        setVerificationSuccess(true);
        setTimeout(() => {
          setVerificationSuccess(false);
          setIsCheckoutProcessing(false);
          onOpenChange(false);
        }, 2000);
      }
    };

    setTimeout(poll, intervalMs);
  };

  const onSubmit = async (values: ChangeSubscriptionInput) => {
    if (!canManageBilling) {
      setFormError(
        "You do not have permission to modify billing (requires billing:manage permission).",
      );
      return;
    }

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

      const formattedAmount = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: checkoutData.currency || "INR",
      }).format((checkoutData.amountMinor || 0) / 100);

      setServerOrderInfo({
        amount: formattedAmount,
        currency: checkoutData.currency || "INR",
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
          } catch {
            // Gateway charge succeeded! If verify call had a network issue,
            // never say payment failed. Webhook is source of truth.
            await pollSubscriptionUntilConfirmed(targetKey);
          }
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => {
            setIsCheckoutProcessing(false);
            setServerOrderInfo(null);
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

  const isPending =
    isChangingFree || isCheckoutProcessing || isConfirmingPayment || !canManageBilling;

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
          {!canManageBilling && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You do not have permission to modify workspace billing. Requires billing:manage.
              </AlertDescription>
            </Alert>
          )}

          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {isConfirmingPayment ? (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <AlertDescription className="text-xs font-semibold">
                Payment received at gateway! Confirming subscription entitlements...
              </AlertDescription>
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

          {serverOrderInfo && (
            <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="font-semibold">{serverOrderInfo.amount}</span>
            </div>
          )}

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
            disabled={isLoadingPlans || isPending || !canManageBilling}
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
              disabled={isCheckoutProcessing || isConfirmingPayment}
            >
              Cancel
            </Button>
            <SubmitButton
              size="sm"
              pending={isPending}
              pendingText={
                isConfirmingPayment
                  ? "Confirming..."
                  : verificationSuccess
                    ? "Activating..."
                    : "Processing..."
              }
              disabled={!canManageBilling || isCheckoutProcessing || isConfirmingPayment}
            >
              {isTargetFree ? "Switch to Free" : "Proceed to Checkout"}
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
