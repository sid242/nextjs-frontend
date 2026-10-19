"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";

import { forgotPassword } from "../api";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const methods = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    meta: { silent: true },
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
    },
  });

  if (submittedEmail) {
    return (
      <div className="grid gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold">Check your inbox</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            If an account exists for{" "}
            <span className="text-foreground font-semibold">{submittedEmail}</span>, we have sent
            instructions to reset your password.
          </p>
        </div>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/login">Return to Sign In</Link>
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
        name="email"
        label="Account Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        required
      />

      <SubmitButton pending={mutation.isPending} pendingText="Sending link…">
        Send Reset Link
      </SubmitButton>

      <p className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </FormWrapper>
  );
}
