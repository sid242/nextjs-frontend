"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderPlus } from "lucide-react";
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

import { useCreateFolder } from "../queries";
import { folderFormSchema, type FolderFormValues } from "../schemas";

export interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolderId?: string | null;
  parentFolderName?: string | null;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentFolderId,
  parentFolderName,
}: CreateFolderDialogProps) {
  const createFolderMutation = useCreateFolder();

  const methods = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      methods.reset({ name: "" });
    }
  }, [open, methods]);

  const onSubmit = async (values: FolderFormValues) => {
    try {
      await createFolderMutation.mutateAsync({
        name: values.name.trim(),
        parentId: parentFolderId ?? null,
      });
      toast.success(`Folder "${values.name.trim()}" created successfully`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create folder. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="text-primary size-5" />
              Create New Folder
            </DialogTitle>
            <DialogDescription>
              {parentFolderName
                ? `Create a subfolder inside "${parentFolderName}".`
                : "Create a root folder to group related workspace documents."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ControlledInput
              name="name"
              label="Folder Name"
              placeholder="e.g. Legal Contracts, Invoices 2026"
              autoFocus
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={createFolderMutation.isPending}
              pendingText="Creating…"
              size="sm"
            >
              Create Folder
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
