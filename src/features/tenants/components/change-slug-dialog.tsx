"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Globe, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useDebouncedValue } from "@/lib/hooks";

import { useChangeTenantSlug, useCheckTenantSlug } from "../queries";

interface ChangeSlugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  currentSlug: string;
}

export function ChangeSlugDialog({
  open,
  onOpenChange,
  tenantId,
  currentSlug,
}: ChangeSlugDialogProps) {
  const router = useRouter();
  const [newSlug, setNewSlug] = useState("");
  const debouncedSlug = useDebouncedValue(newSlug.trim().toLowerCase(), 300);

  const changeSlugMutation = useChangeTenantSlug(tenantId);
  const { data: availability, isLoading: isChecking } = useCheckTenantSlug(
    debouncedSlug !== currentSlug ? debouncedSlug : undefined,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewSlug("");
    }
    onOpenChange(nextOpen);
  };

  const isSameAsCurrent = debouncedSlug === currentSlug.toLowerCase();
  const isDnsValid = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(debouncedSlug);
  const isAvailable = availability?.available ?? false;
  const canSubmit = isDnsValid && !isSameAsCurrent && isAvailable && !changeSlugMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await changeSlugMutation.mutateAsync({ slug: debouncedSlug });
      toast.success(`Workspace slug changed to "${debouncedSlug}"`, {
        description: "Old links will automatically redirect for 90 days.",
      });
      setNewSlug("");
      onOpenChange(false);
      router.push(`/w/${debouncedSlug}/settings/general`);
    } catch {
      toast.error("Failed to update workspace slug.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-primary flex items-center gap-2">
            <Globe className="size-5" />
            <DialogTitle>Change Workspace Slug</DialogTitle>
          </div>
          <DialogDescription>Update the URL identifier for this organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Alert className="border-border/80 bg-accent/30 text-xs">
            <Sparkles className="text-primary size-4" />
            <AlertTitle className="text-xs font-semibold">Automatic 90-Day Redirection</AlertTitle>
            <AlertDescription className="text-muted-foreground text-xs leading-relaxed">
              Your previous slug (
              <span className="text-foreground font-mono font-semibold">{currentSlug}</span>) will
              be reserved and automatically redirected to your new slug for 90 days so no links
              break.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <Label htmlFor="new-slug-input" className="text-xs font-medium">
              New Workspace Slug
            </Label>
            <div className="relative">
              <Input
                id="new-slug-input"
                value={newSlug}
                onChange={(e) =>
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="e.g. acme-corp"
                className="pr-8 font-mono text-xs"
                maxLength={63}
                disabled={changeSlugMutation.isPending}
                autoFocus
              />
              <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                {isChecking ? (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                ) : debouncedSlug && !isSameAsCurrent && isDnsValid ? (
                  isAvailable ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="text-destructive size-4" />
                  )
                ) : null}
              </div>
            </div>

            {debouncedSlug && !isSameAsCurrent && (
              <p className="text-[11px]">
                {!isDnsValid ? (
                  <span className="text-destructive">
                    Must be 3-63 characters, lowercase letters, numbers, and hyphens (cannot start
                    or end with hyphen).
                  </span>
                ) : isChecking ? (
                  <span className="text-muted-foreground">Checking availability…</span>
                ) : isAvailable ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    ✓ &quot;{debouncedSlug}&quot; is available!
                  </span>
                ) : (
                  <span className="text-destructive">
                    &quot;{debouncedSlug}&quot; is already in use or reserved.
                  </span>
                )}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={changeSlugMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit} className="gap-2">
              {changeSlugMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Updating…
                </>
              ) : (
                "Update Slug"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
