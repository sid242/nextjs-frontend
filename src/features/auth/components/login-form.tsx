"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getErrorMessage } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/auth/paths";
import { resetAllStores } from "@/lib/stores/reset";

import { login } from "../api";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const methods = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    meta: { silent: true }, // inline error below
    onSuccess: () => {
      queryClient?.clear?.();
      resetAllStores();
      router?.replace?.(safeNextPath(next));
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
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        required
      />
      <div className="grid gap-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Password</label>
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <ControlledInput
          name="password"
          label=""
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      <SubmitButton pending={mutation?.isPending} pendingText="Signing in…">
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
    </FormWrapper>
  );
}
