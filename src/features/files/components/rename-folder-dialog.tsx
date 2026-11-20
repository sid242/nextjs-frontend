"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
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
import type { FileFolderRecord } from "@/lib/api/types";

import { useUpdateFolder } from "../queries";
import { folderFormSchema, type FolderFormValues } from "../schemas";

export interface RenameFolderDialogProps {
  folder: FileFolderRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameFolderDialog({ folder, open, onOpenChange }: RenameFolderDialogProps) {
  const updateFolderMutation = useUpdateFolder();

  const methods = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: { name: folder?.name ?? "" },
  });

  useEffect(() => {
    if (open && folder) {
      methods.reset({ name: folder.name });
    }
  }, [open, folder, methods]);

  const onSubmit = async (values: FolderFormValues) => {
    if (!folder) return;
    try {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        name: values.name.trim(),
      });
      toast.success(`Folder renamed to "${values.name.trim()}"`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to rename folder. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="text-primary size-5" />
              Rename Folder
            </DialogTitle>
            <DialogDescription>
              Enter a new name for folder &ldquo;{folder?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ControlledInput
              name="name"
              label="Folder Name"
              placeholder="e.g. Updated Folder Name"
              autoFocus
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={updateFolderMutation.isPending}
              pendingText="Renaming…"
              size="sm"
            >
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
