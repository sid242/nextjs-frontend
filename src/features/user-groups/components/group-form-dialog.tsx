"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";

import { ControlledInput, ControlledTextarea, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { createGroupSchema, type CreateGroupValues } from "../schemas";
import type { UserGroup } from "../types";

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: UserGroup | null;
  onSubmit: (values: CreateGroupValues) => Promise<void>;
  isLoading?: boolean;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  groupToEdit,
  onSubmit,
  isLoading = false,
}: GroupFormDialogProps) {
  const isEditing = Boolean(groupToEdit);

  const methods = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: groupToEdit?.name ?? "",
      slug: groupToEdit?.slug ?? "",
      description: groupToEdit?.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        name: groupToEdit?.name ?? "",
        slug: groupToEdit?.slug ?? "",
        description: groupToEdit?.description ?? "",
      });
    } else {
      methods.reset();
    }
  }, [open, groupToEdit, methods]);

  const handleSubmit: SubmitHandler<CreateGroupValues> = async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User Group" : "Create New User Group"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update group attributes and details."
              : "Group users together for administration, assignment, and team organization."}
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={handleSubmit} className="space-y-4 py-2">
          <ControlledInput
            name="name"
            label="Group Name"
            placeholder="e.g. Teaching Staff, Engineering Core"
            required
            disabled={isLoading}
          />

          <ControlledInput
            name="slug"
            label="Slug"
            placeholder="e.g. teaching-staff"
            hint="Optional, auto-generated if blank"
            disabled={isLoading}
          />

          <ControlledTextarea
            name="description"
            label="Description"
            placeholder="Brief description of the group purpose and scope..."
            disabled={isLoading}
            rows={3}
          />

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <SubmitButton
              pending={isLoading || methods.formState.isSubmitting}
              pendingText={isEditing ? "Saving Changes…" : "Creating Group…"}
            >
              {isEditing ? "Save Changes" : "Create Group"}
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
