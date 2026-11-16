"use client";

import { useState } from "react";
import { Briefcase, Building, Camera, User } from "lucide-react";

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

import { usePlatformMe, useUpdatePlatformProfile } from "../queries";

interface PlatformProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlatformProfileFormInner({ onClose }: { onClose: () => void }) {
  const { data: staff } = usePlatformMe();
  const updateMutation = useUpdatePlatformProfile();

  const [displayName, setDisplayName] = useState(staff?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(staff?.avatarUrl ?? "");
  const [department, setDepartment] = useState(staff?.department ?? "");
  const [jobTitle, setJobTitle] = useState(staff?.jobTitle ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (avatarUrl && !avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
      setError("Profile picture must be a valid http or https URL");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
        department: department.trim() || null,
        jobTitle: jobTitle.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex items-center gap-4 py-1">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-500/30 bg-indigo-500/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Profile picture preview from dynamic URL
            <img
              src={avatarUrl}
              alt={displayName || "Staff Profile"}
              className="h-full w-full object-cover"
              onError={() => setError("Unable to load image from provided URL")}
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

      <div className="space-y-1.5">
        <Label htmlFor="staff-display-name">Display Name</Label>
        <Input
          id="staff-display-name"
          placeholder="e.g. Sarah Connor"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="staff-avatar-url" className="flex items-center gap-1.5">
          <Camera className="text-muted-foreground h-3.5 w-3.5" />
          <span>Profile Picture URL</span>
        </Label>
        <Input
          id="staff-avatar-url"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => {
            setAvatarUrl(e.target.value);
            setError(null);
          }}
        />
        <p className="text-muted-foreground text-[11px]">
          Enter an image URL (PNG, JPEG, WebP) to display as your staff avatar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="staff-job-title" className="flex items-center gap-1.5">
            <Briefcase className="text-muted-foreground h-3.5 w-3.5" />
            <span>Job Title</span>
          </Label>
          <Input
            id="staff-job-title"
            placeholder="Security Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="staff-department" className="flex items-center gap-1.5">
            <Building className="text-muted-foreground h-3.5 w-3.5" />
            <span>Department</span>
          </Label>
          <Input
            id="staff-department"
            placeholder="Infrastructure"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-destructive text-xs font-medium">{error}</p>}

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateMutation.isPending || !displayName.trim()}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PlatformProfileDialog({ open, onOpenChange }: PlatformProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
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
