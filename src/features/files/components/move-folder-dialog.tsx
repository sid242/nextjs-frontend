"use client";

import { useMemo, useState } from "react";
import { FolderInput } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FileFolderRecord } from "@/lib/api/types";

import { formatFolderTreeOptions, getFolderDescendantIds } from "../folder-utils";
import { useUpdateFolder } from "../queries";

export interface MoveFolderDialogProps {
  folder: FileFolderRecord | null;
  allFolders: FileFolderRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveFolderDialog({
  folder,
  allFolders,
  open,
  onOpenChange,
}: MoveFolderDialogProps) {
  if (!open || !folder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <MoveFolderDialogContent
        folder={folder}
        allFolders={allFolders}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

function MoveFolderDialogContent({
  folder,
  allFolders,
  onOpenChange,
}: {
  folder: FileFolderRecord;
  allFolders: FileFolderRecord[];
  onOpenChange: (open: boolean) => void;
}) {
  const updateFolderMutation = useUpdateFolder();
  const [selectedParentId, setSelectedParentId] = useState<string>(folder.parentId ?? "root");

  const treeOptions = useMemo(() => {
    const excludeIds = new Set<string>([
      folder.id,
      ...getFolderDescendantIds(folder.id, allFolders),
    ]);
    return formatFolderTreeOptions(allFolders, excludeIds);
  }, [folder.id, allFolders]);

  const handleMove = async () => {
    const targetParentId = selectedParentId === "root" ? null : selectedParentId;

    if (targetParentId === (folder.parentId ?? null)) {
      onOpenChange(false);
      return;
    }

    try {
      await updateFolderMutation.mutateAsync({
        id: folder.id,
        parentId: targetParentId,
      });
      toast.success(
        targetParentId
          ? `Moved "${folder.name}" to new destination.`
          : `Moved "${folder.name}" to Top Level (Root).`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Failed to move folder. Please try again.");
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FolderInput className="text-primary size-5" />
          Move Folder
        </DialogTitle>
        <DialogDescription>
          Choose a destination folder for &ldquo;{folder.name}&rdquo;, or move it to top-level.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-4">
        <label className="text-muted-foreground text-xs font-medium">Destination Folder</label>
        <Select value={selectedParentId} onValueChange={setSelectedParentId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select destination folder" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="root">📂 Root (Top Level / All Files)</SelectItem>
            {treeOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {"\u00A0\u00A0".repeat(opt.depth)}📁 {opt.name}
                {opt.depth > 0 ? ` (${opt.path})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button size="sm" disabled={updateFolderMutation.isPending} onClick={handleMove}>
          {updateFolderMutation.isPending ? "Moving…" : "Move Folder"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
