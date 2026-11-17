"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { initiateSso } from "@/features/sso";
import { getErrorMessage } from "@/lib/api/errors";
import { resetAllStores } from "@/lib/stores/reset";
import { executePostLoginRouting, routeAfterLogin } from "@/lib/tenancy/after-login";

import { login } from "../api";
import { loginSchema, type LoginValues } from "../schemas";
import { TwoFactorChallengeForm } from "./two-factor-challenge-form";

interface SsoApiError {
  code?: string;
  message?: string;
  details?: {
    ssoRequired?: boolean;
    tenantName?: string;
    ssoLoginUrl?: string;
    ssoAvailable?: boolean;
  };
}

export function LoginForm({
  next,
  targetTenant,
}: {
  next?: string;
  targetTenant?: { id: string; name: string; slug: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  const methods = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSsoLogin = async () => {
    const email = methods.getValues("email")?.trim();
    if (!targetTenant?.slug && !email) {
      methods.setError("email", {
        type: "manual",
        message: "Enter your enterprise email to continue with SSO",
      });
      return;
    }

    setSsoLoading(true);
    try {
      const res = await initiateSso({
        email: email || undefined,
        tenantSlug: targetTenant?.slug,
        returnTo: next || "/",
      });
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: unknown) {
      setSsoLoading(false);
      const msg = getErrorMessage(err);
      toast.error(msg || "SSO initiation failed for this email/workspace");
    }
  };

  const loginMutation = useMutation({
    mutationFn: login,
    meta: { silent: true },
    onSuccess: async (data) => {
      if (data?.twoFactorRequired && data?.challengeToken) {
        setChallengeToken(data.challengeToken);
        return;
      }

      queryClient?.clear?.();
      resetAllStores();

      const currentHost = typeof window !== "undefined" ? window.location.host : "";
      const result = routeAfterLogin(data?.memberships, currentHost, next);
      await executePostLoginRouting(result, router);
    },
  });

  if (challengeToken) {
    return (
      <TwoFactorChallengeForm
        challengeToken={challengeToken}
        next={next}
        targetTenant={targetTenant}
        onCancel={() => {
          setChallengeToken(null);
          loginMutation.reset();
        }}
      />
    );
  }

  const apiError = loginMutation?.error as (Error & SsoApiError) | null;
  const isSsoRequired =
    loginMutation?.isError &&
    (apiError?.code === "SSO_REQUIRED" || Boolean(apiError?.details?.ssoRequired));
  const ssoDetails = apiError?.details;
  const ssoLoginUrl = ssoDetails?.ssoLoginUrl;

  return (
    <div className="grid gap-5">
      <FormWrapper
        methods={methods}
        onSubmit={(values) => loginMutation?.mutate(values)}
        className="grid gap-4"
      >
        {isSsoRequired ? (
          <Alert className="border-primary/50 bg-primary/10">
            <Building2 className="text-primary size-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Single Sign-On (SSO) is required for {ssoDetails?.tenantName || "your workspace"}.
                Please sign in with SSO.
              </span>
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (ssoLoginUrl) {
                    window.location.href = ssoLoginUrl;
                  } else {
                    handleSsoLogin();
                  }
                }}
              >
                Continue with SSO
              </Button>
            </AlertDescription>
          </Alert>
        ) : loginMutation?.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(loginMutation?.error)}</AlertDescription>
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

        <SubmitButton pending={loginMutation?.isPending} pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </FormWrapper>

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border/60 w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full text-xs font-medium"
        onClick={handleSsoLogin}
        disabled={ssoLoading}
      >
        <Building2 className="mr-2 h-4 w-4" />
        {ssoLoading ? "Connecting to SSO…" : "Sign in with Enterprise SSO"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        No account?{" "}
        <Link
          href={targetTenant?.slug ? `/w/${targetTenant.slug}/register` : "/register"}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
