"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/lib/api/errors";
import { isPlatformLogin, isPlatformPath, safeNextPath } from "@/lib/auth/paths";
import { useHydrated } from "@/lib/hooks/use-hydrated";

import { usePlatformLogin, useVerifyPlatformTwoFactor } from "../queries";
import {
  platformLoginSchema,
  platformVerificationSchema,
  type PlatformLoginInput,
  type PlatformVerificationInput,
} from "../schemas";

export function PlatformLoginForm({ next }: { next?: string }) {
  const hydrated = useHydrated();
  const [attempt, setAttempt] = useState({
    token: "",
    recoveryMode: false,
    error: "",
  });

  const { mutateAsync: login, isPending: isLoggingIn } = usePlatformLogin();
  const { mutateAsync: verifyTwoFactor, isPending: isVerifying } = useVerifyPlatformTwoFactor();
  const credentials = useForm<PlatformLoginInput>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const verification = useForm<PlatformVerificationInput>({
    resolver: zodResolver(platformVerificationSchema),
    defaultValues: { code: "" },
  });

  function finishSignIn() {
    const target = safeNextPath(next, PLATFORM_ROUTES.DASHBOARD);
    const { origin, pathname, search, hash } = new URL(target, window.location.origin);
    const destination =
      origin === window.location.origin &&
      isPlatformPath(pathname) &&
      !isPlatformLogin(pathname.replace(/\/+$/, ""))
        ? pathname + search + hash
        : PLATFORM_ROUTES.DASHBOARD;
    window.location.replace(destination);
  }

  async function onSubmit(values: PlatformLoginInput) {
    setAttempt((current) => ({ ...current, error: "" }));
    try {
      const result = await login(values);
      if (result?.twoFactorRequired && result?.challengeToken) {
        credentials.resetField("password");
        setAttempt({ token: result.challengeToken, recoveryMode: false, error: "" });
        return;
      }

      finishSignIn();
    } catch (error) {
      setAttempt((current) => ({
        ...current,
        error: getErrorMessage(error, "Unable to sign in. Try again."),
      }));
    }
  }

  async function onVerify({ code }: PlatformVerificationInput) {
    setAttempt((current) => ({ ...current, error: "" }));
    try {
      await verifyTwoFactor({ challengeToken: attempt.token, code });
      finishSignIn();
    } catch (error) {
      setAttempt((current) => ({
        ...current,
        error: getErrorMessage(error, "Unable to verify the code. Try again."),
      }));
    }
  }

  const inChallenge = Boolean(attempt.token);
  const alert = attempt.error ? (
    <Alert variant="destructive">
      <AlertDescription>{attempt.error}</AlertDescription>
    </Alert>
  ) : null;

  return (
    <Card className="border-border/80 w-full max-w-md gap-6 shadow-xs">
      <CardHeader className="gap-2">
        <div className="bg-primary/10 text-primary mb-2 grid size-11 place-items-center rounded-xl">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-balance">
          <h1>{inChallenge ? "Verify your sign-in" : "Sign in to Platform Console"}</h1>
        </CardTitle>
        <CardDescription>
          {inChallenge
            ? attempt.recoveryMode
              ? "Enter a 10-character recovery code."
              : "Enter the 6-digit code from your authenticator app."
            : "Use your platform staff account to manage workspaces."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inChallenge ? (
          <div className="grid gap-3">
            <FormWrapper methods={verification} onSubmit={onVerify} className="grid gap-4">
              {alert}
              <ControlledInput
                name="code"
                label={attempt.recoveryMode ? "Recovery code" : "Authenticator code"}
                autoComplete="one-time-code"
                inputMode={attempt.recoveryMode ? "text" : "numeric"}
                autoCapitalize={attempt.recoveryMode ? "characters" : "none"}
                className="h-10 rounded-xl"
                disabled={isVerifying}
                autoFocus
                required
              />
              <SubmitButton
                className="h-10 rounded-xl"
                pending={isVerifying}
                pendingText="Verifying…"
              >
                Verify and sign in
              </SubmitButton>
            </FormWrapper>
            <Button
              type="button"
              variant="outline"
              disabled={isVerifying}
              onClick={() => {
                verification.reset();
                setAttempt((current) => ({
                  ...current,
                  recoveryMode: !current.recoveryMode,
                  error: "",
                }));
                verification.setFocus("code");
              }}
            >
              {attempt.recoveryMode ? "Use authenticator code" : "Use recovery code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isVerifying}
              onClick={() => {
                verification.reset();
                setAttempt({ token: "", recoveryMode: false, error: "" });
              }}
            >
              Return to password sign-in
            </Button>
          </div>
        ) : (
          <FormWrapper methods={credentials} onSubmit={onSubmit} className="grid gap-4">
            {alert}
            <ControlledInput
              name="email"
              label="Staff email"
              type="email"
              autoComplete="username"
              placeholder="name@company.com"
              className="h-10 rounded-xl"
              disabled={!hydrated || isLoggingIn}
              required
            />
            <ControlledInput
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              className="h-10 rounded-xl"
              disabled={!hydrated || isLoggingIn}
              required
            />
            <SubmitButton
              className="h-10 rounded-xl"
              disabled={!hydrated}
              pending={isLoggingIn}
              pendingText="Signing in…"
            >
              Sign in
            </SubmitButton>
          </FormWrapper>
        )}
      </CardContent>
    </Card>
  );
}
