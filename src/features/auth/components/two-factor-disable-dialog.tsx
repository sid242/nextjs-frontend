"use client";

import { useState, type FormEvent } from "react";
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

interface DisableFormState {
  password: string;
  code: string;
  errorMsg: string | null;
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorDisableDialogProps) {
  const [formState, setFormState] = useState<DisableFormState>({
    password: "",
    code: "",
    errorMsg: null,
  });

  const disableMutation = useDisableTwoFactor();

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, errorMsg: null }));

    try {
      await disableMutation.mutateAsync({
        password: formState.password,
        code: formState.code,
      });

      toast.success("Two-factor authentication disabled successfully");
      setFormState({ password: "", code: "", errorMsg: null });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = getErrorMessage(err);
      setFormState((prev) => ({ ...prev, errorMsg: message }));
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setFormState({ password: "", code: "", errorMsg: null });
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border/80 rounded-2xl shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2 text-base font-semibold">
            <ShieldAlertIcon className="size-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-xs">
            Disabling two-factor authentication makes your account less secure. To confirm this
            action, enter your account password and the 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>

        {formState.errorMsg ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription className="text-xs">{formState.errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleDisable} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="disable-password" className="text-muted-foreground text-xs font-medium">
              Current Account Password
            </Label>
            <Input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={formState.password}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, password: e?.target?.value ?? "" }))
              }
              className="border-border/80 h-10 rounded-xl text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disable-code" className="text-muted-foreground text-xs font-medium">
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
              value={formState.code}
              onChange={(e) =>
                setFormState((prev) => ({
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
              disabled={disableMutation.isPending}
              className="border-border/80 h-10 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                disableMutation.isPending || !formState.password || formState.code.length !== 6
              }
              className="h-10 rounded-xl text-xs"
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
