"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, KeyRound, Lock, Mail, Radio, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/auth/paths";

import { usePlatformLogin } from "../queries";
import { platformLoginSchema, type PlatformLoginInput } from "../schemas";

export function PlatformLoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: login, isPending } = usePlatformLogin();

  const methods = useForm<PlatformLoginInput>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: {
      email: "superadmin@platform.local",
      password: "Password@123456",
    },
  });

  const onSubmit = async (values: PlatformLoginInput) => {
    setErrorMsg(null);
    try {
      await login({ email: values?.email?.trim?.() ?? "", password: values?.password ?? "" });
      const target = safeNextPath(next, "/platform/staff");
      router?.push?.(target);
      router?.refresh?.();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Invalid platform credentials or account suspended"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 text-white shadow-lg shadow-red-500/25">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <h1 className="text-xl font-bold tracking-tight">SaaS Platform Console</h1>
          <Badge variant="outline" className="border-red-500/40 font-mono text-[10px] text-red-500">
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
            <Lock className="h-4 w-4 text-red-500" />
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
              disabled={isPending}
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
              disabled={isPending}
              required
              className="h-9 text-xs"
            />

            <SubmitButton
              pending={isPending}
              pendingText="Verifying Credentials..."
              className="h-9 w-full gap-2 bg-gradient-to-r from-red-600 to-amber-600 text-xs text-white shadow-md shadow-red-600/20 hover:from-red-700 hover:to-amber-700"
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
              Email: <span className="text-foreground">superadmin@platform.local</span>
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
