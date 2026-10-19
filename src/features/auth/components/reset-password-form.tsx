"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";

import { resetPassword } from "../api";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const methods = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    meta: { silent: true },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    },
  });

  if (success) {
    return (
      <div className="grid gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold">Password updated</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Your password has been reset successfully. Redirecting you to sign in…
          </p>
        </div>
        <Button asChild className="mt-2">
          <Link href="/login">Sign In Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <FormWrapper
      methods={methods}
      onSubmit={(values) => mutation.mutate(values)}
      className="grid gap-4"
    >
      {mutation.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(mutation.error)}</AlertDescription>
        </Alert>
      ) : null}

      <ControlledInput
        name="newPassword"
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
      />

      <ControlledInput
        name="confirmPassword"
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
      />

      <SubmitButton pending={mutation.isPending} pendingText="Resetting password…">
        Reset Password
      </SubmitButton>
    </FormWrapper>
  );
}
