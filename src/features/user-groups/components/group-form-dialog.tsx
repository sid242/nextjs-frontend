"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { createGroupSchema, type CreateGroupValues } from "../schemas";
import type { UserGroup } from "../types";

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: UserGroup | null;
  onSubmit: (values: CreateGroupValues) => Promise<void>;
  isLoading?: boolean;
}

interface InnerFormProps {
  groupToEdit?: UserGroup | null;
  onCancel: () => void;
  onSubmit: (values: CreateGroupValues) => Promise<void>;
  isLoading: boolean;
}

function InnerGroupForm({ groupToEdit, onCancel, onSubmit, isLoading }: InnerFormProps) {
  const [formData, setFormData] = useState<CreateGroupValues>({
    name: groupToEdit?.name ?? "",
    slug: groupToEdit?.slug ?? "",
    description: groupToEdit?.description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = createGroupSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string") {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(validation.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrors({ form: message });
    }
  };

  const isEditing = Boolean(groupToEdit);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {errors.form && (
        <div className="bg-destructive/15 text-destructive rounded-lg p-3 text-sm">
          {errors.form}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="group-name">Group Name *</Label>
        <Input
          id="group-name"
          placeholder="e.g. Teaching Staff, Engineering Core"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          disabled={isLoading}
          className="h-10 rounded-xl"
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="group-slug">
          Slug{" "}
          <span className="text-muted-foreground font-normal">
            (Optional, auto-generated if blank)
          </span>
        </Label>
        <Input
          id="group-slug"
          placeholder="e.g. teaching-staff"
          value={formData.slug}
          onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
          disabled={isLoading}
          className="h-10 rounded-xl"
        />
        {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="group-description">Description</Label>
        <Textarea
          id="group-description"
          placeholder="Brief description of the group purpose and scope..."
          value={formData.description ?? ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          disabled={isLoading}
          rows={3}
          className="rounded-xl"
        />
        {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
      </div>

      <DialogFooter className="gap-2 pt-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-10 rounded-xl"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="h-10 rounded-xl">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Group"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function GroupFormDialog({
  open,
  onOpenChange,
  groupToEdit,
  onSubmit,
  isLoading = false,
}: GroupFormDialogProps) {
  const isEditing = Boolean(groupToEdit);

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

        {open && (
          <InnerGroupForm
            key={groupToEdit?.id ?? "new-group"}
            groupToEdit={groupToEdit}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
