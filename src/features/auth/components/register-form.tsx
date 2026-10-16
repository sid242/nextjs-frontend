"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { getErrorMessage } from "@/lib/api/errors";
import { resetAllStores } from "@/lib/stores/reset";
import { register } from "../api";
import { registerSchema, type RegisterValues } from "../schemas";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const methods = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: register,
    meta: { silent: true },
    onSuccess: () => {
      queryClient?.clear?.();
      resetAllStores();
      router?.replace?.("/dashboard");
      router?.refresh?.();
    },
  });

  return (
    <FormWrapper
      methods={methods}
      onSubmit={(values) => mutation?.mutate(values)}
      className="grid gap-4"
    >
      {mutation?.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(mutation?.error)}</AlertDescription>
        </Alert>
      ) : null}
      <ControlledInput
        name="name"
        label="Name"
        autoComplete="name"
        placeholder="Jane Doe"
        required
      />
      <ControlledInput
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        required
      />
      <ControlledInput
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        hint="At least 8 characters."
        required
      />
      <SubmitButton pending={mutation?.isPending} pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-muted-foreground text-center text-sm">
        Already registered?{" "}
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
