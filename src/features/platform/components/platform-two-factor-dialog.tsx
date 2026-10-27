"use client";

import { useState, type FormEvent } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  KeyRound,
  Loader2Icon,
  QrCodeIcon,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

import {
  useDisablePlatformTwoFactor,
  useEnablePlatformTwoFactor,
  usePlatformTwoFactorStatus,
  useSetupPlatformTwoFactor,
} from "../queries";

interface PlatformTwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformTwoFactorDialog({ open, onOpenChange }: PlatformTwoFactorDialogProps) {
  const [view, setView] = useState<"status" | "setup" | "recovery" | "disable">("status");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>("");
  const [setupCode, setSetupCode] = useState<string>("");
  const [disablePassword, setDisablePassword] = useState<string>("");
  const [disableCode, setDisableCode] = useState<string>("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading, refetch } = usePlatformTwoFactorStatus();
  const setupMutation = useSetupPlatformTwoFactor();
  const enableMutation = useEnablePlatformTwoFactor();
  const disableMutation = useDisablePlatformTwoFactor();

  const isEnabled = Boolean(status?.enabled);

  const resetState = () => {
    setView("status");
    setErrorMsg(null);
    setSetupCode("");
    setDisablePassword("");
    setDisableCode("");
    setRecoveryCodes([]);
    setQrDataUrl(null);
    setSecret("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const startSetup = async () => {
    setErrorMsg(null);
    setView("setup");
    try {
      const res = await setupMutation.mutateAsync();
      const rawSecret = res?.secret ?? "";
      setSecret(rawSecret);

      if (res?.otpauthUri) {
        const dataUrl = await QRCode.toDataURL(res.otpauthUri, {
          margin: 2,
          width: 220,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

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
      "Platform Operator Two-Factor Recovery Codes",
      "Created: " + new Date().toISOString(),
      "---------------------------------------------",
      "Treat these codes like your root operator password.",
      "Each code can be used once to regain access to the platform console.",
      "",
      ...recoveryCodes,
      "",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-operator-2fa-recovery-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  const handleConfirmSetup = async (e: FormEvent) => {
    e?.preventDefault?.();
    if (!setupCode || setupCode.trim().length !== 6) {
      setErrorMsg("Please enter a valid 6-digit TOTP verification code.");
      return;
    }

    setErrorMsg(null);
    try {
      const res = await enableMutation.mutateAsync({ code: setupCode.trim() });
      const codes = res?.recoveryCodes ?? [];
      setRecoveryCodes(codes);
      setView("recovery");
      refetch();
      toast.success("Platform Two-Factor Authentication enabled successfully!");
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleConfirmDisable = async (e: FormEvent) => {
    e?.preventDefault?.();
    if (!disablePassword) {
      setErrorMsg("Please enter your platform password to verify identity.");
      return;
    }
    if (!disableCode || disableCode.trim().length === 0) {
      setErrorMsg("Please enter your current 6-digit authenticator code.");
      return;
    }

    setErrorMsg(null);
    try {
      await disableMutation.mutateAsync({
        password: disablePassword,
        code: disableCode.trim(),
      });
      toast.success("Platform Two-Factor Authentication disabled.");
      refetch();
      setView("status");
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Platform Operator Security & 2FA
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage Time-based One-Time Password (TOTP) two-factor authentication for your internal
            operator account.
          </DialogDescription>
        </DialogHeader>

        {errorMsg ? (
          <Alert variant="destructive" className="my-2">
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {/* View 1: Main Status */}
        {view === "status" && (
          <div className="space-y-4 py-2">
            <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Authenticator App (TOTP)</p>
                  <p className="text-muted-foreground text-xs">
                    {statusLoading
                      ? "Checking status..."
                      : isEnabled
                        ? `Active since ${status?.enabledAt ? new Date(status.enabledAt).toLocaleDateString() : "recently"}`
                        : "Mandatory for elevated platform operators"}
                  </p>
                </div>
              </div>

              <div>
                {statusLoading ? (
                  <Loader2Icon className="text-muted-foreground h-4 w-4 animate-spin" />
                ) : isEnabled ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Enforced
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    Not Set
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-muted-foreground bg-muted/40 rounded-lg p-3 text-xs leading-relaxed">
              Platform operators carry system-wide privileges across customer tenants, database
              provisioning, and support delegation. Multi-factor authentication adds an essential
              layer of defense against credential stuffing and compromised sessions.
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setErrorMsg(null);
                    setDisablePassword("");
                    setDisableCode("");
                    setView("disable");
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Disable 2FA
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={startSetup}
                  disabled={setupMutation.isPending}
                >
                  {setupMutation.isPending ? (
                    <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Configure 2FA
                </Button>
              )}
            </DialogFooter>
          </div>
        )}

        {/* View 2: Setup Scanning & Verification */}
        {view === "setup" && (
          <div className="space-y-4 py-2">
            {setupMutation.isPending ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Loader2Icon className="text-muted-foreground h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-xs">Generating secure operator key...</p>
              </div>
            ) : (
              <>
                <div className="border-border/80 bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border p-4">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Operator TOTP QR Code"
                      className="h-44 w-44 rounded-md bg-white p-2 shadow-xs"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-44 w-44 items-center justify-center rounded-md">
                      <QrCodeIcon className="h-12 w-12 opacity-40" />
                    </div>
                  )}

                  <p className="text-muted-foreground max-w-xs text-center text-[11px]">
                    Scan this QR code with 1Password, Google Authenticator, or Microsoft
                    Authenticator:
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
                      className="h-8 w-8 shrink-0"
                    >
                      {copiedSecret ? (
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <CopyIcon className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleConfirmSetup} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="platformSetupCode" className="text-xs font-medium">
                      Enter 6-Digit Code from Authenticator
                    </Label>
                    <Input
                      id="platformSetupCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      placeholder="000000"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e?.target?.value ?? "")}
                      className="text-center font-mono tracking-widest"
                      required
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setView("status")}
                      disabled={enableMutation.isPending}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                      disabled={enableMutation.isPending || setupCode.length !== 6}
                    >
                      {enableMutation.isPending && (
                        <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      Verify & Enable
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </div>
        )}

        {/* View 3: Recovery Codes */}
        {view === "recovery" && (
          <div className="space-y-4 py-2">
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs">
                Save these recovery codes now. They will <strong>not</strong> be shown again. Each
                code can be used once if you lose access to your TOTP device.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/40 border-border/80 grid grid-cols-2 gap-2 rounded-lg border p-3">
              {recoveryCodes?.map((rc, idx) => (
                <div
                  key={idx}
                  className="bg-background rounded border px-2 py-1 text-center font-mono text-xs select-all"
                >
                  {rc}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleCopyRecoveryCodes}
              >
                {copiedRecovery ? (
                  <CheckIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copiedRecovery ? "Copied" : "Copy Codes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDownloadRecoveryCodes}
              >
                <DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
                Download .txt
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                size="sm"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => {
                  setView("status");
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* View 4: Disable Confirmation */}
        {view === "disable" && (
          <form onSubmit={handleConfirmDisable} className="space-y-4 py-2">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Disabling 2FA will lower your operator account protection. You will only require
                your master password to sign into the platform console.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="platformDisablePassword" className="text-xs font-medium">
                  Confirm Master Password
                </Label>
                <Input
                  id="platformDisablePassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e?.target?.value ?? "")}
                  autoComplete="current-password"
                  autoFocus
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="platformDisableCode" className="text-xs font-medium">
                  Enter Current Authenticator Code
                </Label>
                <Input
                  id="platformDisableCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e?.target?.value ?? "")}
                  className="text-center font-mono tracking-widest"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView("status")}
                disabled={disableMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={disableMutation.isPending || !disablePassword || !disableCode}
              >
                {disableMutation.isPending && (
                  <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Confirm & Disable
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
