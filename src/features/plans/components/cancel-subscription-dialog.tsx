"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useCancelTenantSubscription } from "@/features/billing";
import { getErrorMessage } from "@/lib/api/errors";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd?: string | null;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  currentPeriodEnd,
}: CancelSubscriptionDialogProps) {
  const [reason, setReason] = useState("");
  const [immediately, setImmediately] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: cancelSub, isPending } = useCancelTenantSubscription();

  const handleCancel = async () => {
    setError(null);
    try {
      await cancelSub({
        immediately,
        reason: reason.trim() ? reason : undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to cancel subscription"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancel Workspace Subscription
          </DialogTitle>
          <DialogDescription className="text-xs">
            We are sorry to see you go. Please review the terms below before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="border-border/60 bg-muted/30 space-y-2 rounded-xl border p-3">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Data Retention Guarantee
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Cancelling your paid plan will{" "}
              <strong>never delete your workspace data, members, or files</strong>. Your account
              will automatically transition to the Free plan tier.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Cancellation Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImmediately(false)}
                className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                  !immediately
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border/60 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <div>At Period End (Recommended)</div>
                <div className="mt-0.5 text-[10px] font-normal opacity-75">
                  Keep access until{" "}
                  {currentPeriodEnd
                    ? new Date(currentPeriodEnd).toLocaleDateString()
                    : "end of billing cycle"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImmediately(true)}
                className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                  immediately
                    ? "border-destructive bg-destructive/5 text-destructive font-semibold"
                    : "border-border/60 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <div>Cancel Immediately</div>
                <div className="mt-0.5 text-[10px] font-normal opacity-75">
                  Revert to Free tier limits right now
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs font-medium">
              Reason for leaving (Optional)
            </Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us how we could have done better..."
              className="h-20 resize-none text-xs"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep Subscription
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
