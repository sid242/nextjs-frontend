"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2Icon, CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptWorkspaceInvite } from "@/features/auth";
import { getErrorMessage } from "@/lib/api/errors";
import { tenantStorage } from "@/lib/storage";
import { resetAllStores } from "@/lib/stores/reset";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const tenantId = searchParams.get("tenant");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const acceptMutation = useAcceptWorkspaceInvite();

  const missingTokenError = !token
    ? "No invitation token found. Please check your invitation link."
    : null;
  const activeError = errorMessage || missingTokenError;

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeAcceptance() {
      try {
        const result = await acceptMutation.mutateAsync({
          token: token!,
          tenantId: tenantId ?? undefined,
        });
        if (!isMounted) return;
        resetAllStores();

        const activeId = result?.activeTenantId || tenantId;
        if (activeId) {
          tenantStorage.set(activeId);
        }

        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1200);
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMessage(
          getErrorMessage(err) || "Failed to accept workspace invitation. It may have expired.",
        );
      }
    }

    void executeAcceptance();

    return () => {
      isMounted = false;
    };
  }, [token, tenantId, acceptMutation, router]);

  return (
    <Card className="border-border/60 mx-auto w-full max-w-md shadow-lg transition-all">
      <CardHeader className="text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Building2Icon className="size-6 animate-pulse" />
        </div>
        <CardTitle className="text-xl font-bold">Workspace Invitation</CardTitle>
        <CardDescription>
          {activeError
            ? "Invitation verification failed"
            : acceptMutation.isSuccess
              ? "Invitation accepted! Entering workspace…"
              : "Verifying your workspace invitation…"}
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
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </div>
        ) : acceptMutation.isSuccess ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5 shrink-0" />
              <span className="font-medium">You are now a team member! Loading dashboard…</span>
            </div>
            <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-full animate-pulse transition-all" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <Loader2Icon className="text-primary size-8 animate-spin" />
            <p className="text-muted-foreground text-xs">
              Joining organization and configuring permissions…
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-muted-foreground p-8 text-center text-sm">
            Loading invitation handler…
          </div>
        }
      >
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
