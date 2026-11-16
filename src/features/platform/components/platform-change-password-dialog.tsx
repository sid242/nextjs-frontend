"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
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

import { useChangePlatformPassword } from "../queries";
import { changePlatformPasswordSchema, type ChangePlatformPasswordInput } from "../schemas";

interface PlatformChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlatformChangePasswordFormInner({ onClose }: { onClose: () => void }) {
  const changePasswordMutation = useChangePlatformPassword();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const methods = useForm<ChangePlatformPasswordInput>({
    resolver: zodResolver(changePlatformPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePlatformPasswordInput) => {
    setFormError(null);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      toast.success("Platform password updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to change password"));
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">Password Changed Successfully</p>
        <p className="text-muted-foreground text-xs">
          Your credentials have been securely updated in the platform vault.
        </p>
      </div>
    );
  }

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <ControlledInput
        control={methods.control}
        name="currentPassword"
        type="password"
        label="Current Password"
        placeholder="••••••••••••"
        autoComplete="current-password"
        required
      />

      <ControlledInput
        control={methods.control}
        name="newPassword"
        type="password"
        label="New Password"
        placeholder="••••••••••••"
        description="Must be at least 8 characters long."
        autoComplete="new-password"
        required
      />

      <ControlledInput
        control={methods.control}
        name="confirmPassword"
        type="password"
        label="Confirm New Password"
        placeholder="••••••••••••"
        autoComplete="new-password"
        required
      />

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={changePasswordMutation.isPending}
        >
          Cancel
        </Button>
        <SubmitButton pending={changePasswordMutation.isPending} pendingText="Updating...">
          Update Password
        </SubmitButton>
      </DialogFooter>
    </FormWrapper>
  );
}

export function PlatformChangePasswordDialog({
  open,
  onOpenChange,
}: PlatformChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            <span>Change Operator Password</span>
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a secure new password for your account.
          </DialogDescription>
        </DialogHeader>

        {open && <PlatformChangePasswordFormInner onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
