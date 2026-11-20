"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2Icon,
  CheckCircle2Icon,
  Loader2Icon,
  MailIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/errors";
import { resetAllStores } from "@/lib/stores/reset";

import { useAcceptWorkspaceInvite, usePreviewWorkspaceInvite } from "../queries";
import { acceptInviteNewUserSchema, type AcceptInviteNewUserValues } from "../schemas";

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const tenantId = searchParams.get("tenant") ?? undefined;

  const [clientError, setClientError] = useState<string | null>(null);

  const methods = useForm<AcceptInviteNewUserValues>({
    resolver: zodResolver(acceptInviteNewUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = usePreviewWorkspaceInvite(token);
  const acceptMutation = useAcceptWorkspaceInvite();

  const missingTokenError = !token
    ? "No invitation token found. Please check your invitation link."
    : null;
  const activeError =
    clientError ||
    (previewError ? getErrorMessage(previewError, "Invalid or expired invitation token.") : null) ||
    missingTokenError;

  const handleAcceptNewUser = async (values: AcceptInviteNewUserValues) => {
    setClientError(null);

    try {
      await acceptMutation.mutateAsync({
        token,
        tenantId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        password: values.password,
      });

      resetAllStores();
      const destination = preview?.tenantSlug
        ? `/w/${preview.tenantSlug}/dashboard`
        : "/select-workspace";
      router.replace(destination);
      router.refresh();
    } catch (err: unknown) {
      setClientError(
        getErrorMessage(err, "Failed to create account and accept invitation. Please try again."),
      );
    }
  };

  const handleAcceptExistingUser = async () => {
    setClientError(null);
    try {
      const res = await acceptMutation.mutateAsync({
        token,
        tenantId,
      });

      if ((res as unknown as { requiresLogin?: boolean })?.requiresLogin) {
        const nextUrl = `/accept-invite?token=${encodeURIComponent(token)}${tenantId ? `&tenant=${encodeURIComponent(tenantId)}` : ""}`;
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      resetAllStores();
      const destination = preview?.tenantSlug
        ? `/w/${preview.tenantSlug}/dashboard`
        : "/select-workspace";
      router.replace(destination);
      router.refresh();
    } catch (err: unknown) {
      setClientError(
        getErrorMessage(err, "Failed to accept invitation. Please ensure you are logged in."),
      );
    }
  };

  return (
    <Card className="border-border/60 mx-auto w-full max-w-md shadow-xl transition-all">
      <CardHeader className="text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Building2Icon className="size-6 animate-pulse" />
        </div>
        <CardTitle className="text-xl font-bold">
          {preview?.tenantName ? `Join ${preview.tenantName}` : "Workspace Invitation"}
        </CardTitle>
        <CardDescription>
          {isPreviewLoading
            ? "Verifying your invitation link…"
            : preview?.hasAccount
              ? "You've been invited to join an existing organization."
              : "Set up your password and profile to accept your invitation."}
        </CardDescription>

        {preview && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="gap-1 font-mono text-xs">
              <MailIcon className="size-3" />
              {preview.email}
            </Badge>
            <Badge variant="secondary" className="gap-1 font-mono text-xs">
              <ShieldCheckIcon className="size-3" />
              {preview.roleName}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-6">
        {activeError ? (
          <div className="grid gap-4 text-center">
            <Alert variant="destructive">
              <XCircleIcon className="size-4 shrink-0" />
              <AlertDescription>{activeError}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </div>
        ) : acceptMutation.isSuccess ? (
          <div className="grid gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5 shrink-0" />
              <span className="font-medium">You are now a team member! Entering workspace…</span>
            </div>
            <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary h-full w-full animate-pulse transition-all" />
            </div>
          </div>
        ) : isPreviewLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <Loader2Icon className="text-primary size-8 animate-spin" />
            <p className="text-muted-foreground text-xs">Verifying invitation security token…</p>
          </div>
        ) : preview?.hasAccount ? (
          <div className="grid gap-4 text-center">
            <p className="text-muted-foreground text-xs">
              An account already exists for <strong>{preview.email}</strong>. Click below to accept
              this workspace invitation using your existing credentials.
            </p>
            <Button
              onClick={handleAcceptExistingUser}
              disabled={acceptMutation.isPending}
              className="w-full gap-2"
            >
              {acceptMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Accept &amp; Join Workspace
            </Button>
            <div className="text-muted-foreground text-xs">
              Need to sign in first?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
                className="text-primary hover:underline"
              >
                Sign in here
              </Link>
            </div>
          </div>
        ) : (
          <FormWrapper methods={methods} onSubmit={handleAcceptNewUser} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ControlledInput
                name="firstName"
                label="First Name"
                placeholder="Jane"
                autoComplete="given-name"
                required
              />
              <ControlledInput
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                autoComplete="family-name"
                required
              />
            </div>

            <ControlledInput
              name="password"
              label="Create Password (min. 8 characters)"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <ControlledInput
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <SubmitButton
              pending={acceptMutation.isPending}
              pendingText="Creating Account…"
              className="mt-2 w-full gap-2"
            >
              <CheckCircle2Icon className="size-4" />
              Create Account &amp; Join Workspace
            </SubmitButton>
          </FormWrapper>
        )}
      </CardContent>
    </Card>
  );
}

export function AcceptInviteForm() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground p-8 text-center text-sm">
          Loading invitation handler…
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
