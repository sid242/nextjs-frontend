"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/http";

const requestEmailSchema = z.object({
  newEmail: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

const confirmEmailSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required"),
});

type RequestEmailValues = z.infer<typeof requestEmailSchema>;
type ConfirmEmailValues = z.infer<typeof confirmEmailSchema>;

interface EmailChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
  onSuccess?: () => void;
}

export function EmailChangeDialog({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}: EmailChangeDialogProps) {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [targetEmail, setTargetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestForm = useForm<RequestEmailValues>({
    resolver: zodResolver(requestEmailSchema),
    defaultValues: { newEmail: "" },
    mode: "onChange",
  });

  const confirmForm = useForm<ConfirmEmailValues>({
    resolver: zodResolver(confirmEmailSchema),
    defaultValues: { token: "" },
    mode: "onChange",
  });

  const handleRequestSubmit = async (values: RequestEmailValues) => {
    if (values.newEmail === currentEmail?.toLowerCase()) {
      requestForm.setError("newEmail", {
        message: "New email must be different from current email",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/users/me/email-change/request", { newEmail: values.newEmail });
      setTargetEmail(values.newEmail);
      setStep("confirm");
      toast.success(`Verification link sent to ${values.newEmail}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to request email change");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async (values: ConfirmEmailValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/users/me/email-change/confirm", { token: values.token });
      toast.success("Email address updated successfully! Please re-authenticate if prompted.");
      onOpenChange(false);
      setStep("request");
      requestForm.reset();
      confirmForm.reset();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired verification token");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("request");
      requestForm.reset();
      confirmForm.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
              {step === "request" ? (
                <MailIcon className="size-4" />
              ) : (
                <MailCheckIcon className="size-4" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Change Email Address</DialogTitle>
              <DialogDescription className="text-xs">
                {step === "request"
                  ? "Enter your new email address. A verification token will be sent to confirm."
                  : `Enter the verification token sent to ${targetEmail}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "request" ? (
          <FormWrapper
            methods={requestForm}
            onSubmit={handleRequestSubmit}
            className="space-y-4 pt-2"
          >
            <ControlledInput
              name="newEmail"
              label="New Email Address"
              type="email"
              placeholder="name@example.com"
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <SubmitButton pending={isSubmitting} pendingText="Sending Link…" size="sm">
                Send Verification Token
              </SubmitButton>
            </div>
          </FormWrapper>
        ) : (
          <FormWrapper
            methods={confirmForm}
            onSubmit={handleConfirmSubmit}
            className="space-y-4 pt-2"
          >
            <ControlledInput
              name="token"
              label="Verification Token"
              placeholder="Paste verification token"
              required
              autoFocus
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("request")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <SubmitButton pending={isSubmitting} pendingText="Confirming…" size="sm">
                  Confirm Change
                </SubmitButton>
              </div>
            </div>
          </FormWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
