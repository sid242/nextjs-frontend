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
import { safeNextPath } from "@/lib/auth/paths";
import { resetAllStores } from "@/lib/stores/reset";
import { login } from "../api";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    meta: { silent: true }, // the error is shown inline below, so skip the global toast
    onSuccess: () => {
      queryClient.clear(); // a different user may have used this tab before: start clean
      resetAllStores();
      router.replace(safeNextPath(next));
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
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register("email")}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register("password")}
      />
      <SubmitButton pending={mutation.isPending} pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-muted-foreground text-center text-sm">
        No account?{" "}
        <Link
          href="/register"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
