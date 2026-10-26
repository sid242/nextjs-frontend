"use client";

import { useState } from "react";
import { Loader2Icon, ShieldAlertIcon } from "lucide-react";
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

import { useDisableTwoFactor } from "../queries";

interface TwoFactorDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorDisableDialogProps) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const disableMutation = useDisableTwoFactor();

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await disableMutation.mutateAsync({
        password,
        code,
      });

      toast.success("Two-factor authentication disabled successfully");
      setPassword("");
      setCode("");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPassword("");
          setCode("");
          setErrorMsg(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <ShieldAlertIcon className="size-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Disabling two-factor authentication makes your account less secure. To confirm this
            action, enter your account password and the 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>

        {errorMsg ? (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleDisable} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="disable-password" className="text-xs font-medium">
              Current Account Password
            </Label>
            <Input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e?.target?.value ?? "")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disable-code" className="text-xs font-medium">
              6-Digit Authenticator Code
            </Label>
            <Input
              id="disable-code"
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
              disabled={disableMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={disableMutation.isPending || !password || code.length !== 6}
            >
              {disableMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Disabling…
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
