"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, KeyRound, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES, ROUTES } from "@/config/routes";
import { initiateSso } from "@/features/sso";
import { getErrorMessage } from "@/lib/api/errors";
import { useHydrated } from "@/lib/hooks/use-hydrated";
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
  targetTenant?: { id: string; name: string; slug: string; ssoConfigured?: boolean };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const authRoutes = targetTenant?.slug ? ROUTES.tenant(targetTenant.slug) : AUTH_ROUTES;
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
        return;
      }
      setSsoLoading(false);
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
      const result = routeAfterLogin(data?.memberships, currentHost, next, targetTenant?.slug);
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
  const busy = !hydrated || ssoLoading || loginMutation?.isPending;

  return (
    <div className="grid gap-5">
      <FormWrapper
        methods={methods}
        onSubmit={(values) => loginMutation?.mutate(values)}
        className="grid gap-4"
      >
        {isSsoRequired ? (
          <Alert
            className="border-primary/50 bg-primary/10 rounded-[var(--radius)]"
            style={{ borderRadius: "var(--radius)" }}
          >
            <Building2 className="text-primary size-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Single Sign-On (SSO) is required for {ssoDetails?.tenantName || "your workspace"}.
                Please sign in with SSO.
              </span>
              <Button
                type="button"
                size="sm"
                className="w-full rounded-[var(--radius)]"
                style={{ borderRadius: "var(--radius)" }}
                disabled={busy}
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
          <Alert
            variant="destructive"
            className="rounded-[var(--radius)]"
            style={{ borderRadius: "var(--radius)" }}
          >
            <AlertDescription>{getErrorMessage(loginMutation?.error)}</AlertDescription>
          </Alert>
        ) : null}

        <ControlledInput
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          prefix={<Mail className="text-muted-foreground size-4" />}
          className="h-10 rounded-[var(--radius)]"
          style={{ borderRadius: "var(--radius)" }}
          disabled={busy}
          required
        />

        <ControlledInput
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          prefix={<KeyRound className="text-muted-foreground size-4" />}
          className="h-10 rounded-[var(--radius)]"
          style={{ borderRadius: "var(--radius)" }}
          disabled={busy}
          required
        />

        <SubmitButton
          className="h-10 w-full gap-2 rounded-[var(--radius)] font-medium shadow-xs"
          style={{ borderRadius: "var(--radius)" }}
          disabled={busy}
          pending={loginMutation?.isPending}
          pendingText="Signing in…"
        >
          Sign in
          <ArrowRight className="size-4" />
        </SubmitButton>

        <div className="text-center">
          <Link
            href={authRoutes.FORGOT_PASSWORD}
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </FormWrapper>

      {(!targetTenant || targetTenant.ssoConfigured) && (
        <>
          <div className="text-muted-foreground flex items-center gap-3 text-xs before:flex-1 before:border-t after:flex-1 after:border-t">
            or
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-[var(--radius)]"
            style={{ borderRadius: "var(--radius)" }}
            onClick={handleSsoLogin}
            disabled={busy}
          >
            <Building2 className="mr-2 size-4" />
            {ssoLoading ? "Connecting to SSO…" : "Sign in with Enterprise SSO"}
          </Button>
        </>
      )}

      <div className="flex flex-col gap-2 pt-1 text-center text-sm">
        <p className="text-muted-foreground">
          No account?{" "}
          <Link
            href={authRoutes.REGISTER}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>

        {targetTenant?.slug ? (
          <p className="text-muted-foreground text-xs">
            Not your workspace?{" "}
            <Link
              href={AUTH_ROUTES.SELECT_WORKSPACE}
              className="text-primary font-medium hover:underline"
            >
              Switch workspace
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
