"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/errors";

import { useChangePassword } from "../queries";
import { changePasswordSchema, type ChangePasswordValues } from "../schemas";

export function ChangePasswordCard() {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const methods = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const mutation = useChangePassword();

  const onSubmit = async (values: ChangePasswordValues) => {
    setErrorMsg(null);
    setSuccess(false);

    try {
      const res = await mutation.mutateAsync(values);
      setSuccess(true);
      toast.success(res?.message ?? "Password updated successfully!");
      methods.reset();
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRoundIcon className="text-muted-foreground size-5" />
          <CardTitle className="text-base font-semibold">Change Password</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Ensure your account is using a long, random password to stay secure. Must be at least 8
          characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <ShieldCheckIcon className="size-4" />
            <AlertDescription className="text-xs font-medium">
              Your password has been changed successfully.
            </AlertDescription>
          </Alert>
        )}

        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-xs font-medium">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <FormWrapper methods={methods} onSubmit={onSubmit} className="grid max-w-md gap-4">
          <ControlledInput
            name="currentPassword"
            type="password"
            label="Current Password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
          />

          <ControlledInput
            name="newPassword"
            type="password"
            label="New Password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            hint="Minimum 8 characters, different from current"
            required
          />

          <ControlledInput
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            required
          />

          <div className="pt-2">
            <SubmitButton
              pending={mutation.isPending}
              pendingText="Updating password…"
              disabled={!methods.formState.isDirty}
            >
              Update Password
            </SubmitButton>
          </div>
        </FormWrapper>
      </CardContent>
    </Card>
  );
}
