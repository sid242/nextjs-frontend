"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
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

import { useRegenerateRecoveryCodes } from "../queries";

interface TwoFactorRecoveryCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorRecoveryCodesDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorRecoveryCodesDialogProps) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const regenerateMutation = useRegenerateRecoveryCodes();

  const handleRegenerate = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password && !code) {
      setErrorMsg("Please enter either your password or 6-digit authenticator code.");
      return;
    }

    try {
      const res = await regenerateMutation.mutateAsync({
        password: password || undefined,
        code: code || undefined,
      });

      setNewCodes(res.recoveryCodes);
      toast.success("10 new recovery codes generated.");
      onSuccess();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const handleCopyAll = async () => {
    if (!newCodes?.length) return;
    try {
      await navigator.clipboard.writeText(newCodes.join("\n"));
      setCopied(true);
      toast.success("Recovery codes copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy recovery codes.");
    }
  };

  const handleClose = () => {
    setPassword("");
    setCode("");
    setErrorMsg(null);
    setNewCodes(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="text-muted-foreground size-5" />
            <DialogTitle>2FA Recovery Codes</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {newCodes
              ? "Store these codes safely. Each recovery code can only be used once if you lose access to your authenticator app."
              : "Regenerating recovery codes will invalidate all of your previous recovery codes immediately."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {newCodes ? (
          <div className="space-y-4">
            <div className="bg-muted/50 border-border/60 grid grid-cols-2 gap-2 rounded-lg border p-3 font-mono text-xs">
              {newCodes.map((c, i) => (
                <div key={i} className="bg-background/80 rounded px-2 py-1 text-center font-medium">
                  {c}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy All Codes"}
              </Button>
            </div>
          </div>
        ) : (
          <form id="regen-codes-form" onSubmit={handleRegenerate} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="regen-password" className="text-xs">
                Account Password
              </Label>
              <Input
                id="regen-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-border/60 absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <span className="bg-background text-muted-foreground relative px-2 text-[10px] uppercase">
                Or enter authenticator code
              </span>
            </div>

            <div className="space-y-1">
              <Label htmlFor="regen-code" className="text-xs">
                6-Digit Authenticator Code
              </Label>
              <Input
                id="regen-code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-xs"
              />
            </div>
          </form>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs">
            {newCodes ? "Done" : "Cancel"}
          </Button>
          {!newCodes && (
            <Button
              type="submit"
              form="regen-codes-form"
              size="sm"
              disabled={regenerateMutation.isPending}
              className="gap-1.5 text-xs"
            >
              {regenerateMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-3.5" />
              )}
              Regenerate Codes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
