"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  QrCodeIcon,
  ShieldCheckIcon,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errors";

import { useEnableTwoFactor, useSetupTwoFactor } from "../queries";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TwoFactorSetupState {
  step: "scan" | "recovery";
  qrDataUrl: string | null;
  secret: string;
  code: string;
  copiedSecret: boolean;
  copiedRecovery: boolean;
  recoveryCodes: string[];
  errorMsg: string | null;
}

const INITIAL_SETUP_STATE: TwoFactorSetupState = {
  step: "scan",
  qrDataUrl: null,
  secret: "",
  code: "",
  copiedSecret: false,
  copiedRecovery: false,
  recoveryCodes: [],
  errorMsg: null,
};

export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }: TwoFactorSetupDialogProps) {
  const [setupState, setSetupState] = useState<TwoFactorSetupState>(INITIAL_SETUP_STATE);

  const setupMutation = useSetupTwoFactor();
  const { mutateAsync: runSetup } = setupMutation;
  const enableMutation = useEnableTwoFactor();

  const resetState = () => {
    setSetupState(INITIAL_SETUP_STATE);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    runSetup()
      .then(async (res) => {
        if (!isMounted) return;
        const uri = res?.otpauthUri;
        const rawSecret = res?.secret ?? "";
        setSetupState((prev) => ({ ...prev, secret: rawSecret }));

        if (uri) {
          try {
            const dataUrl = await QRCode.toDataURL(uri, {
              margin: 2,
              width: 220,
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            });
            if (isMounted) setSetupState((prev) => ({ ...prev, qrDataUrl: dataUrl }));
          } catch {
            // Fallback gracefully to secret key display only
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setSetupState((prev) => ({ ...prev, errorMsg: getErrorMessage(err) }));
      });

    return () => {
      isMounted = false;
    };
  }, [open, runSetup]);

  const handleCopySecret = async () => {
    if (!setupState.secret) return;
    await navigator.clipboard.writeText(setupState.secret);
    setSetupState((prev) => ({ ...prev, copiedSecret: true }));
    toast.success("Secret copied to clipboard");
    setTimeout(() => setSetupState((prev) => ({ ...prev, copiedSecret: false })), 2000);
  };

  const handleCopyRecoveryCodes = async () => {
    if (!setupState.recoveryCodes?.length) return;
    await navigator.clipboard.writeText(setupState.recoveryCodes.join("\n"));
    setSetupState((prev) => ({ ...prev, copiedRecovery: true }));
    toast.success("Recovery codes copied to clipboard");
    setTimeout(() => setSetupState((prev) => ({ ...prev, copiedRecovery: false })), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!setupState.recoveryCodes?.length) return;
    const content = [
      "Two-Factor Authentication Recovery Codes",
      "Created: " + new Date().toISOString(),
      "----------------------------------------",
      "Treat these recovery codes like your password.",
      "Each code can only be used once if you lose access to your authenticator device.",
      "",
      ...setupState.recoveryCodes,
      "",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `2fa-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  const handleConfirmCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!setupState.code || setupState.code.length !== 6) {
      setSetupState((prev) => ({
        ...prev,
        errorMsg: "Please enter a valid 6-digit verification code",
      }));
      return;
    }

    setSetupState((prev) => ({ ...prev, errorMsg: null }));
    try {
      const res = await enableMutation.mutateAsync({ code: setupState.code });
      const codes = res?.recoveryCodes ?? [];
      setSetupState((prev) => ({
        ...prev,
        recoveryCodes: codes,
        step: "recovery",
      }));
      toast.success("Two-factor authentication enabled successfully!");
    } catch (err) {
      const msg = getErrorMessage(err);
      setSetupState((prev) => ({ ...prev, errorMsg: msg }));
      toast.error(msg);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/80 rounded-2xl shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheckIcon className="text-primary size-5" />
            {setupState.step === "scan"
              ? "Set Up Two-Factor Authentication"
              : "Save Recovery Codes"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {setupState.step === "scan"
              ? "Scan the QR code with your authenticator app (such as Google Authenticator, Authy, or 1Password)."
              : "Store these single-use recovery codes in a safe place. You will need them if you lose access to your authenticator app."}
          </DialogDescription>
        </DialogHeader>

        {setupState.errorMsg ? (
          <Alert variant="destructive" className="my-2 rounded-xl">
            <AlertDescription className="text-xs">{setupState.errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {setupState.step === "scan" ? (
          <div className="space-y-4 py-2">
            {setupMutation.isPending ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
                <p className="text-muted-foreground text-xs">Generating your secure 2FA secret…</p>
              </div>
            ) : (
              <>
                <div className="border-border/80 bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-xl border p-4">
                  {setupState.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Data URL generated dynamically
                    <img
                      src={setupState.qrDataUrl}
                      alt="Two Factor QR Code"
                      className="size-48 rounded-xl bg-white p-2 shadow-xs"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex size-48 items-center justify-center rounded-xl">
                      <QrCodeIcon className="size-12 opacity-40" />
                    </div>
                  )}

                  <p className="text-muted-foreground max-w-xs text-center text-[11px]">
                    Can&apos;t scan the QR code? Enter this key manually in your authenticator app:
                  </p>

                  <div className="flex w-full max-w-xs items-center gap-2">
                    <code className="bg-background border-border/80 flex-1 truncate rounded-xl border px-2.5 py-1.5 text-center font-mono text-xs select-all">
                      {setupState.secret || "••••••••••••••••"}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      disabled={!setupState.secret}
                      title="Copy secret key"
                      className="border-border/80 size-8.5 shrink-0 rounded-xl"
                    >
                      {setupState.copiedSecret ? (
                        <CheckIcon className="size-3.5 text-emerald-500" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleConfirmCode} className="space-y-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="twoFactorCode"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Enter 6-Digit Code from App
                    </Label>
                    <Input
                      id="twoFactorCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="123456"
                      value={setupState.code}
                      onChange={(e) =>
                        setSetupState((prev) => ({
                          ...prev,
                          code: e?.target?.value?.replace(/\D/g, "") ?? "",
                        }))
                      }
                      className="border-border/80 h-10 rounded-xl text-center font-mono text-base tracking-widest"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={enableMutation.isPending}
                      className="border-border/80 h-10 rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={enableMutation.isPending || setupState.code.length !== 6}
                      className="h-10 rounded-xl text-xs"
                    >
                      {enableMutation.isPending ? (
                        <>
                          <Loader2Icon className="mr-2 size-4 animate-spin" />
                          Activating…
                        </>
                      ) : (
                        "Verify and Activate"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <Alert className="rounded-xl border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
              <AlertDescription className="text-xs">
                These recovery codes will <strong>never be shown again</strong>. Download or copy
                them now to avoid being locked out of your account.
              </AlertDescription>
            </Alert>

            <div className="border-border/80 bg-muted/40 grid grid-cols-2 gap-2 rounded-xl border p-4 font-mono text-sm">
              {setupState.recoveryCodes?.map((recCode, idx) => (
                <div
                  key={idx}
                  className="border-border/60 bg-background/80 rounded-lg border px-2.5 py-1 text-center font-semibold tracking-wider select-all"
                >
                  {recCode}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyRecoveryCodes}
                className="border-border/80 h-9 flex-1 rounded-xl text-xs"
              >
                {setupState.copiedRecovery ? (
                  <>
                    <CheckIcon className="mr-1.5 size-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="mr-1.5 size-3.5" />
                    Copy All Codes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadRecoveryCodes}
                className="border-border/80 h-9 flex-1 rounded-xl text-xs"
              >
                <DownloadIcon className="mr-1.5 size-3.5" />
                Download .txt
              </Button>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                onClick={handleFinish}
                className="h-10 w-full rounded-xl text-xs"
              >
                I Have Saved My Recovery Codes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
