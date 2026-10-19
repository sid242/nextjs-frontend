"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, MailIcon, XCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/errors";
import { useCountdown, useSearchQueryParams } from "@/lib/hooks";

import { useRequestEmailVerification, useVerifyEmail } from "../queries";
import { requestEmailVerificationSchema, type RequestEmailVerificationValues } from "../schemas";

export function VerifyEmailView({ token: propToken }: { token?: string }) {
  const { get } = useSearchQueryParams();
  const token = propToken ?? get("token") ?? undefined;
  const [resendSuccess, setResendSuccess] = useState(false);
  const [backendMsg, setBackendMsg] = useState<string | null>(null);
  const verifyMutation = useVerifyEmail();
  const requestMutation = useRequestEmailVerification();

  const countdown = useCountdown({
    seconds: 60,
    autoStart: false,
  });

  const methods = useForm<RequestEmailVerificationValues>({
    resolver: zodResolver(requestEmailVerificationSchema),
    defaultValues: { email: "" },
  });

  // Automatically verify when a token is provided in the query string
  useEffect(() => {
    if (!token) return;

    verifyMutation.mutate(token, {
      onSuccess: (data) => {
        toast.success(data?.message || "Email verified successfully.");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount with token
  }, [token]);

  const onResend = async (values: RequestEmailVerificationValues) => {
    try {
      const res = await requestMutation.mutateAsync(values);
      const message = res?.message || "Verification email sent.";
      setBackendMsg(message);
      setResendSuccess(true);
      countdown.start();
      toast.success(message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // 1. In-progress token verification
  if (token && verifyMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <Spinner className="size-8" />
        <h3 className="text-base font-semibold">Verifying your email address…</h3>
        <p className="text-muted-foreground text-xs">Please wait while we confirm your account.</p>
      </div>
    );
  }

  // 2. Token successfully verified
  if (token && verifyMutation.isSuccess) {
    return (
      <div className="grid gap-4 py-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2Icon className="size-6" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold">Email Verified Successfully</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {verifyMutation.data?.message ||
              "Your account email has been confirmed. You now have full access to your organization workspace."}
          </p>
        </div>
        <Button asChild className="mt-2 w-full">
          <Link href="/login">Continue to Sign In</Link>
        </Button>
      </div>
    );
  }

  // 3. Token verification failed
  if (token && verifyMutation.isError) {
    return (
      <div className="grid gap-4 py-2">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <XCircleIcon className="size-6" />
        </div>
        <div className="grid gap-1 text-center">
          <h3 className="text-base font-semibold">Verification Failed</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {getErrorMessage(verifyMutation.error) ||
              "This verification token is no longer valid. Request a fresh link below."}
          </p>
        </div>

        {resendSuccess ? (
          <div className="grid gap-2">
            <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2Icon className="size-4" />
              <AlertDescription className="text-xs font-medium">
                {backendMsg || "A fresh verification email has been sent. Please check your inbox."}
              </AlertDescription>
            </Alert>
            <div className="text-center text-xs">
              {!countdown.isComplete && countdown.isRunning ? (
                <p className="text-muted-foreground">
                  Didn&apos;t receive it? Resend available in{" "}
                  <span className="text-foreground font-mono font-medium">
                    {countdown.formatted}
                  </span>
                </p>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => {
                    setResendSuccess(false);
                    countdown.reset();
                  }}
                >
                  Resend another email
                </Button>
              )}
            </div>
          </div>
        ) : (
          <FormWrapper methods={methods} onSubmit={onResend} className="mt-2 grid gap-3">
            <ControlledInput
              name="email"
              type="email"
              label="Your Account Email"
              placeholder="you@company.com"
              required
            />
            <SubmitButton
              pending={requestMutation.isPending}
              pendingText="Sending link…"
              className="w-full"
            >
              Resend Verification Email
            </SubmitButton>
          </FormWrapper>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // 4. No token provided: request email form
  return (
    <div className="grid gap-4 py-2">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
        <MailIcon className="size-6" />
      </div>

      <div className="grid gap-1 text-center">
        <h3 className="text-base font-semibold">Confirm your email address</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Enter your registered email address below to receive an account confirmation link.
        </p>
      </div>

      {resendSuccess ? (
        <div className="grid gap-3 text-center">
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-left text-emerald-700 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4" />
            <AlertDescription className="text-xs font-medium">
              {backendMsg ||
                "If an account exists for that email, a verification link has been sent to your inbox."}
            </AlertDescription>
          </Alert>

          {!countdown.isComplete && countdown.isRunning ? (
            <p className="text-muted-foreground text-xs">
              Resend code in{" "}
              <span className="text-foreground font-mono font-medium">{countdown.formatted}</span>
            </p>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                setResendSuccess(false);
                countdown.reset();
              }}
            >
              Send to another email
            </Button>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Return to Sign In</Link>
          </Button>
        </div>
      ) : (
        <FormWrapper methods={methods} onSubmit={onResend} className="grid gap-3">
          <ControlledInput
            name="email"
            type="email"
            label="Account Email"
            placeholder="you@company.com"
            required
          />
          <SubmitButton
            pending={requestMutation.isPending}
            pendingText="Sending link…"
            className="w-full"
          >
            Send Verification Email
          </SubmitButton>
        </FormWrapper>
      )}

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
