"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Shield } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
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

import { cloneRoleSchema, type CloneRoleInput, type Role } from "../schemas";

interface CloneRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSubmit: (roleId: string, data: CloneRoleInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function CloneRoleDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isSubmitting = false,
}: CloneRoleDialogProps) {
  const methods = useForm<CloneRoleInput>({
    resolver: zodResolver(cloneRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (role && open) {
      methods.reset({
        name: `Copy of ${role.name}`,
        description: `Cloned from ${role.name}`,
      });
    }
  }, [role, open, methods]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      methods.reset();
    }
    onOpenChange(isOpen);
  };

  const onValidSubmit: SubmitHandler<CloneRoleInput> = async (data) => {
    if (!role?.id) return;
    await onSubmit(role.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="border-primary/20 bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg border">
              <Copy className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Clone Workspace Role</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new custom role pre-populated with all permissions from the source role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {role && (
          <div className="border-border/70 bg-accent/10 space-y-1.5 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Source Template:</span>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={role.isSystem ? "outline" : "secondary"}
                  className="h-5 text-[10px]"
                >
                  {role.isSystem ? "SYSTEM" : "CUSTOM"}
                </Badge>
                <Badge variant="outline" className="h-5 font-mono text-[10px]">
                  <Shield className="mr-1 size-2.5" />
                  {role.permissions?.length ?? 0} permissions
                </Badge>
              </div>
            </div>
            <p className="text-foreground text-sm font-semibold">{role.name}</p>
            {role.description && (
              <p className="text-muted-foreground text-xs leading-relaxed">{role.description}</p>
            )}
          </div>
        )}

        <FormWrapper methods={methods} onSubmit={onValidSubmit}>
          <div className="space-y-4 py-2">
            <ControlledInput
              name="name"
              label="New Role Name"
              placeholder="e.g., Billing Reviewer"
              description="A clear human-readable name for the new role."
              required
            />

            <ControlledInput
              name="description"
              label="Description (Optional)"
              placeholder="Describe what members with this role are allowed to do"
              description="Optional summary displayed on role cards and assignment menus."
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <SubmitButton pending={isSubmitting} className="gap-2">
              <Copy className="size-3.5" /> Clone Role
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
