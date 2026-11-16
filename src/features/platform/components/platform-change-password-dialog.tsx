"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";

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

import { useChangePlatformPassword } from "../queries";

interface PlatformChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlatformChangePasswordFormInner({ onClose }: { onClose: () => void }) {
  const changePasswordMutation = useChangePlatformPassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setError(msg);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">Password Changed Successfully</p>
        <p className="text-muted-foreground text-xs">
          Your credentials have been securely updated in the platform vault.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="staff-current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="staff-current-password"
            type="password"
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="staff-new-password">New Password</Label>
        <div className="relative">
          <Input
            id="staff-new-password"
            type="password"
            placeholder="••••••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <p className="text-muted-foreground text-[11px]">Must be at least 8 characters long.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="staff-confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="staff-confirm-password"
            type="password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-xs font-medium">{error}</p>}

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={changePasswordMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword
          }
        >
          {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PlatformChangePasswordDialog({
  open,
  onOpenChange,
}: PlatformChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            <span>Change Operator Password</span>
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a secure new password for your account.
          </DialogDescription>
        </DialogHeader>

        {open && <PlatformChangePasswordFormInner onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
