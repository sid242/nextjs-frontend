"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/auth/paths";

import { usePlatformLogin, useVerifyPlatformTwoFactor } from "../queries";
import { platformLoginSchema, type PlatformLoginInput } from "../schemas";

export function PlatformLoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const { mutateAsync: login, isPending: isLoggingIn } = usePlatformLogin();
  const { mutateAsync: verifyTwoFactor, isPending: isVerifying } = useVerifyPlatformTwoFactor();

  const methods = useForm<PlatformLoginInput>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: {
      email: "sid.superadmin@yopmail.com",
      password: "Password@123456",
    },
  });

  const onSubmit = async (values: PlatformLoginInput) => {
    setErrorMsg(null);
    try {
      const result = await login({
        email: values?.email?.trim?.() ?? "",
        password: values?.password ?? "",
      });

      if (result?.twoFactorRequired && result?.challengeToken) {
        setChallengeToken(result.challengeToken);
        setCode("");
        return;
      }

      const target = safeNextPath(next, "/platform/dashboard");
      router?.push?.(target);
      router?.refresh?.();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Invalid platform credentials or account suspended"));
    }
  };

  const onVerifyChallenge = async (e: FormEvent) => {
    e?.preventDefault?.();
    if (!challengeToken || !code.trim()) return;

    setErrorMsg(null);
    try {
      await verifyTwoFactor({
        challengeToken,
        code: code.trim(),
      });
      const target = safeNextPath(next, "/platform/dashboard");
      router?.push?.(target);
      router?.refresh?.();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Invalid verification code or expired challenge"));
    }
  };

  if (challengeToken) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h1 className="text-xl font-bold tracking-tight">Two-Factor Authentication</h1>
            <Badge
              variant="outline"
              className="border-indigo-500/30 bg-indigo-500/10 font-mono text-[10px] text-indigo-600 dark:text-indigo-400"
            >
              REQUIRED
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {useRecoveryCode
              ? "Enter one of your 10-character emergency recovery codes."
              : "Enter the 6-digit code from your authenticator app to access the Platform Console."}
          </p>
        </div>

        <Card className="border-border/80 bg-card/60 shadow-xl backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {useRecoveryCode ? "Recovery Code Verification" : "Authenticator Verification"}
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your operator identity to initialize an administrative session.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onVerifyChallenge} className="space-y-4">
              {errorMsg ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="platform-2fa-code" className="text-xs font-medium">
                  {useRecoveryCode ? "Emergency Recovery Code" : "6-Digit Authenticator Code"}
                </Label>
                <Input
                  id="platform-2fa-code"
                  type="text"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder={useRecoveryCode ? "e.g. A1B2C3D4E5" : "••••••"}
                  value={code}
                  onChange={(e) => setCode(e?.target?.value ?? "")}
                  className="text-center font-mono text-base tracking-widest"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifying || code.trim().length < 6}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 font-medium text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700"
              >
                {isVerifying ? "Verifying…" : "Verify and Access Console"}
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setCode("");
                  setErrorMsg(null);
                }}
                className="text-primary cursor-pointer text-xs font-medium hover:underline"
              >
                {useRecoveryCode
                  ? "Use 6-digit Authenticator app code"
                  : "Lost device? Use emergency recovery code"}
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setChallengeToken(null);
                  setCode("");
                  setErrorMsg(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <ArrowLeft className="mr-1 size-3.5" />
                Return to operator login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <h1 className="text-xl font-bold tracking-tight">SaaS Platform Console</h1>
          <Badge
            variant="outline"
            className="border-indigo-500/30 bg-indigo-500/10 font-mono text-[10px] text-indigo-600 dark:text-indigo-400"
          >
            SECURE
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          Internal operator portal &bull; Zero-standing privileges to customer tenants
        </p>
      </div>

      <Card className="border-border/80 bg-card/60 shadow-xl backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Operator Authentication
          </CardTitle>
          <CardDescription className="text-xs">
            Authenticate using your provisioned internal SaaS platform credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
            {errorMsg ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            ) : null}

            <ControlledInput
              name="email"
              label="Staff Email"
              type="email"
              autoComplete="email"
              placeholder="operator@platform.local"
              prefix={<Mail className="h-4 w-4" />}
              disabled={isLoggingIn}
              required
              className="h-9 font-mono text-xs"
            />

            <ControlledInput
              name="password"
              label="Master Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              prefix={<KeyRound className="h-4 w-4" />}
              disabled={isLoggingIn}
              required
              className="h-9 text-xs"
            />

            <SubmitButton
              pending={isLoggingIn}
              pendingText="Verifying Credentials..."
              className="h-9 w-full gap-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-xs text-white shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700"
            >
              Authenticate Platform Session
              <ArrowRight className="h-4 w-4" />
            </SubmitButton>
          </FormWrapper>

          {/* Seed Defaults Reminder */}
          <div className="bg-muted/40 border-border/60 text-muted-foreground mt-4 space-y-1 rounded-lg border p-3 font-mono text-[11px]">
            <div className="text-foreground flex items-center gap-1.5 font-semibold">
              <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
              Default Super Administrator:
            </div>
            <div className="text-muted-foreground text-[10px]">
              Email: <span className="text-foreground">sid.superadmin@yopmail.com</span>
            </div>
            <div className="text-muted-foreground text-[10px]">
              Pass: <span className="text-foreground">Password@123456</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
