"use client";

import { useEffect, useState } from "react";
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

export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<"scan" | "recovery">("scan");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setupMutation = useSetupTwoFactor();
  const { mutateAsync: runSetup } = setupMutation;
  const enableMutation = useEnableTwoFactor();

  const resetState = () => {
    setStep("scan");
    setCode("");
    setErrorMsg(null);
    setQrDataUrl(null);
    setSecret("");
    setRecoveryCodes([]);
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
        setSecret(rawSecret);

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
            if (isMounted) setQrDataUrl(dataUrl);
          } catch {
            // Fallback gracefully to secret key display only
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(getErrorMessage(err));
      });

    return () => {
      isMounted = false;
    };
  }, [open, runSetup]);

  const handleCopySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyRecoveryCodes = async () => {
    if (!recoveryCodes?.length) return;
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedRecovery(true);
    toast.success("Recovery codes copied to clipboard");
    setTimeout(() => setCopiedRecovery(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes?.length) return;
    const content = [
      "Two-Factor Authentication Recovery Codes",
      "Created: " + new Date().toISOString(),
      "----------------------------------------",
      "Treat these recovery codes like your password.",
      "Each code can only be used once if you lose access to your authenticator device.",
      "",
      ...recoveryCodes,
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

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code");
      return;
    }

    setErrorMsg(null);
    try {
      const res = await enableMutation.mutateAsync({ code });
      const codes = res?.recoveryCodes ?? [];
      setRecoveryCodes(codes);
      setStep("recovery");
      toast.success("Two-factor authentication enabled successfully!");
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="text-primary size-5" />
            {step === "scan" ? "Set Up Two-Factor Authentication" : "Save Recovery Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === "scan"
              ? "Scan the QR code with your authenticator app (such as Google Authenticator, Authy, or 1Password)."
              : "Store these single-use recovery codes in a safe place. You will need them if you lose access to your authenticator app."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg ? (
          <Alert variant="destructive" className="my-2">
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {step === "scan" ? (
          <div className="space-y-4 py-2">
            {setupMutation.isPending ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
                <p className="text-muted-foreground text-xs">Generating your secure 2FA secret…</p>
              </div>
            ) : (
              <>
                <div className="border-border/80 bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-lg border p-4">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Data URL generated dynamically
                    <img
                      src={qrDataUrl}
                      alt="Two Factor QR Code"
                      className="size-48 rounded-md bg-white p-2 shadow-xs"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex size-48 items-center justify-center rounded-md">
                      <QrCodeIcon className="size-12 opacity-40" />
                    </div>
                  )}

                  <p className="text-muted-foreground max-w-xs text-center text-[11px]">
                    Can&apos;t scan the QR code? Enter this key manually in your authenticator app:
                  </p>

                  <div className="flex w-full max-w-xs items-center gap-2">
                    <code className="bg-background flex-1 truncate rounded border px-2 py-1 text-center font-mono text-xs select-all">
                      {secret || "••••••••••••••••"}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      disabled={!secret}
                      title="Copy secret key"
                      className="size-8 shrink-0"
                    >
                      {copiedSecret ? (
                        <CheckIcon className="size-3.5 text-emerald-500" />
                      ) : (
                        <CopyIcon className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleConfirmCode} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="twoFactorCode" className="text-xs font-medium">
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
                      value={code}
                      onChange={(e) => setCode(e?.target?.value?.replace(/\D/g, "") ?? "")}
                      className="text-center font-mono text-base tracking-widest"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={enableMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={enableMutation.isPending || code.length !== 6}>
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
            <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
              <AlertDescription className="text-xs">
                These recovery codes will <strong>never be shown again</strong>. Download or copy
                them now to avoid being locked out of your account.
              </AlertDescription>
            </Alert>

            <div className="border-border/80 bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-sm">
              {recoveryCodes?.map((recCode, idx) => (
                <div
                  key={idx}
                  className="border-border/40 bg-background/80 rounded border px-2.5 py-1 text-center font-semibold tracking-wider select-all"
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
                className="flex-1"
              >
                {copiedRecovery ? (
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
                className="flex-1"
              >
                <DownloadIcon className="mr-1.5 size-3.5" />
                Download .txt
              </Button>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" onClick={handleFinish} className="w-full">
                I Have Saved My Recovery Codes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
