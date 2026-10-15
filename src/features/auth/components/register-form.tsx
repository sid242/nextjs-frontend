"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/molecules/form-field";
import { SubmitButton } from "@/components/molecules/submit-button";
import { getErrorMessage } from "@/lib/api/errors";
import { resetAllStores } from "@/lib/stores/reset";
import { register } from "../api";
import { registerSchema, type RegisterValues } from "../schemas";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: register,
    meta: { silent: true }, // shown inline below
    onSuccess: () => {
      queryClient.clear();
      resetAllStores();
      router.replace("/dashboard");
      router.refresh();
    },
  });

  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="grid gap-4"
      noValidate
    >
      {mutation.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(mutation.error)}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...form.register("name")}
      />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register("email")}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={errors.password?.message}
        {...form.register("password")}
      />
      <SubmitButton pending={mutation.isPending} pendingText="Creating account…">
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
    </form>
  );
}
