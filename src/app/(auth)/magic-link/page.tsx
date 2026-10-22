"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon, SparklesIcon, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifyMagicLink } from "@/features/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { resetAllStores } from "@/lib/stores/reset";

function MagicLinkVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verifyMutation = useVerifyMagicLink();

  const missingTokenError = !token
    ? "No magic link token found. Please request a new sign-in link."
    : null;
  const activeError = errorMessage || missingTokenError;

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeVerification() {
      try {
        await verifyMutation.mutateAsync({ token: token! });
        if (!isMounted) return;
        resetAllStores();
        // Give the user a brief visual celebration before entering workspace
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1200);
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMessage(
          getErrorMessage(err) || "Failed to verify magic link. It may have expired.",
        );
      }
    }

    void executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token, verifyMutation, router]);

  return (
    <Card className="border-border/60 mx-auto w-full max-w-md shadow-lg transition-all">
      <CardHeader className="text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <SparklesIcon className="size-6 animate-pulse" />
        </div>
        <CardTitle className="text-xl font-bold">Passwordless Sign-In</CardTitle>
        <CardDescription>
          {activeError
            ? "Authentication verification failed"
            : verifyMutation.isSuccess
              ? "Authentication successful! Redirecting…"
              : "Verifying your secure magic sign-in link…"}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 text-center">
        {activeError ? (
          <div className="grid gap-4">
            <div className="text-destructive flex items-center justify-center gap-2 text-sm">
              <XCircleIcon className="size-5 shrink-0" />
              <span>{activeError}</span>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </div>
        ) : verifyMutation.isSuccess ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5 shrink-0" />
              <span className="font-medium">Welcome back! Preparing your workspace…</span>
            </div>
            <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-full animate-pulse transition-all" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <Loader2Icon className="text-primary size-8 animate-spin" />
            <p className="text-muted-foreground text-xs">
              Validating cryptographic token and establishing session…
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MagicLinkPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-muted-foreground p-8 text-center text-sm">
            Loading authentication handler…
          </div>
        }
      >
        <MagicLinkVerifyContent />
      </Suspense>
    </div>
  );
}
