"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, KeyRoundIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import { safeNextPath } from "@/lib/auth/paths";
import { tenantStorage } from "@/lib/storage";
import { resetAllStores } from "@/lib/stores/reset";

import { useVerifyTwoFactorChallenge } from "../queries";
import { twoFactorChallengeSchema, type TwoFactorChallengeValues } from "../schemas";

interface TwoFactorChallengeFormProps {
  challengeToken: string;
  next?: string;
  targetTenant?: { id: string; name: string; slug: string };
  onCancel: () => void;
}

export function TwoFactorChallengeForm({
  challengeToken,
  next,
  targetTenant,
  onCancel,
}: TwoFactorChallengeFormProps) {
  const router = useRouter();
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const methods = useForm<TwoFactorChallengeValues>({
    resolver: zodResolver(twoFactorChallengeSchema),
    defaultValues: {
      challengeToken,
      code: "",
    },
  });

  const verifyMutation = useVerifyTwoFactorChallenge();

  const onSubmit = async (values: TwoFactorChallengeValues) => {
    setErrorMsg(null);
    try {
      await verifyMutation.mutateAsync({
        challengeToken,
        code: values?.code?.trim() ?? "",
      });

      toast.success("Identity verified successfully");
      resetAllStores();

      if (targetTenant?.id) {
        tenantStorage?.set?.(targetTenant.id);
      }

      router?.replace?.(safeNextPath(next));
      router?.refresh?.();
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 text-primary border-primary/20 mb-3 flex size-12 items-center justify-center rounded-full border shadow-xs">
          {useRecoveryCode ? (
            <KeyRoundIcon className="size-6" />
          ) : (
            <ShieldCheckIcon className="size-6" />
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Two-Factor Authentication</h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          {useRecoveryCode
            ? "Enter one of your 10-character emergency recovery codes to regain access."
            : "Enter the 6-digit verification code from your authenticator application."}
        </p>
      </div>

      <FormWrapper methods={methods} onSubmit={onSubmit} className="grid gap-4">
        {errorMsg ? (
          <Alert variant="destructive">
            <ShieldAlertIcon className="size-4" />
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        <ControlledInput
          name="code"
          label={useRecoveryCode ? "Recovery Code" : "Authentication Code"}
          placeholder={useRecoveryCode ? "e.g. A1B2C3D4E5" : "••••••"}
          autoComplete="one-time-code"
          autoFocus
          className="text-center font-mono text-lg tracking-widest"
          required
        />

        <SubmitButton pending={verifyMutation?.isPending} pendingText="Verifying…">
          Verify and Sign In
        </SubmitButton>
      </FormWrapper>

      <div className="flex flex-col gap-2 pt-1 text-center">
        <button
          type="button"
          onClick={() => {
            setUseRecoveryCode(!useRecoveryCode);
            methods?.reset?.({ challengeToken, code: "" });
            setErrorMsg(null);
          }}
          className="text-primary cursor-pointer text-xs font-medium hover:underline"
        >
          {useRecoveryCode
            ? "Use 6-digit Authenticator app code"
            : "Lost your device? Use an emergency recovery code"}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground mt-1 text-xs"
        >
          <ArrowLeftIcon className="mr-1 size-3.5" />
          Return to password sign in
        </Button>
      </div>
    </div>
  );
}
