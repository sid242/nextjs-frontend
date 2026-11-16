"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Building, Camera, User } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
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
import { getErrorMessage } from "@/lib/api/errors";

import { usePlatformMe, useUpdatePlatformProfile } from "../queries";
import { updatePlatformProfileSchema, type UpdatePlatformProfileInput } from "../schemas";

interface PlatformProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlatformProfileFormInner({ onClose }: { onClose: () => void }) {
  const { data: staff } = usePlatformMe();
  const updateMutation = useUpdatePlatformProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<UpdatePlatformProfileInput>({
    resolver: zodResolver(updatePlatformProfileSchema),
    defaultValues: {
      displayName: staff?.displayName ?? "",
      avatarUrl: staff?.avatarUrl ?? "",
      department: staff?.department ?? "",
      jobTitle: staff?.jobTitle ?? "",
    },
  });

  const avatarUrl = useWatch({ control: methods.control, name: "avatarUrl" });
  const displayName = useWatch({ control: methods.control, name: "displayName" });

  const onSubmit = async (values: UpdatePlatformProfileInput) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        displayName: values.displayName?.trim() || undefined,
        avatarUrl: values.avatarUrl?.trim() || null,
        department: values.department?.trim() || null,
        jobTitle: values.jobTitle?.trim() || null,
      });
      toast.success("Platform operator profile updated successfully!");
      onClose();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to update operator profile"));
    }
  };

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex items-center gap-4 py-1">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-500/30 bg-indigo-500/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Profile picture preview from dynamic URL
            <img
              src={avatarUrl}
              alt={displayName || "Staff Profile"}
              className="h-full w-full object-cover"
            />
          ) : displayName ? (
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="h-8 w-8 text-indigo-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{displayName || "Platform Operator"}</p>
          <p className="text-muted-foreground text-xs">{staff?.email}</p>
          <span className="inline-block rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
            {staff?.roleName ?? staff?.roleKey ?? "Operator"}
          </span>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <ControlledInput
        control={methods.control}
        name="displayName"
        label="Display Name"
        placeholder="e.g. Sarah Connor"
        required
      />

      <ControlledInput
        control={methods.control}
        name="avatarUrl"
        label="Profile Picture URL"
        placeholder="https://example.com/avatar.jpg"
        description="Enter an image URL (PNG, JPEG, WebP) to display as your staff avatar."
      />

      <div className="grid grid-cols-2 gap-3">
        <ControlledInput
          control={methods.control}
          name="jobTitle"
          label="Job Title"
          placeholder="Security Engineer"
        />
        <ControlledInput
          control={methods.control}
          name="department"
          label="Department"
          placeholder="Infrastructure"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <SubmitButton pending={updateMutation.isPending} pendingText="Saving...">
          Save Changes
        </SubmitButton>
      </DialogFooter>
    </FormWrapper>
  );
}

export function PlatformProfileDialog({ open, onOpenChange }: PlatformProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Operator Profile Settings</DialogTitle>
          <DialogDescription>
            Update your platform operator name, profile picture, and operational role info.
          </DialogDescription>
        </DialogHeader>

        {open && <PlatformProfileFormInner onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
