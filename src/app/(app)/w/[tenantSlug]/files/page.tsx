"use client";

import { useState } from "react";
import { Folder, FolderPlus, HardDrive, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FilesSummary,
  FilesTable,
  FileUploader,
  useCreateFolder,
  useFolders,
} from "@/features/files";
import { useActiveTenant } from "@/features/tenants";

export default function FilesPage() {
  const { activeTenant } = useActiveTenant();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showUploader, setShowUploader] = useState(false);

  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const createFolderMutation = useCreateFolder();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      await createFolderMutation.mutateAsync({
        name: folderName.trim(),
        parentId: activeFolderId,
      });
      toast.success(`Folder "${folderName.trim()}" created successfully`);
      setFolderName("");
      setCreateFolderOpen(false);
    } catch {
      toast.error("Failed to create folder. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files & Storage"
        description={`Secure document management and storage for ${activeTenant?.name ?? "your workspace"}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFolderOpen(true)}
              className="flex items-center gap-1.5"
            >
              <FolderPlus className="size-4" />
              <span>New Folder</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowUploader((prev) => !prev)}
              className="flex items-center gap-1.5"
            >
              <Upload className="size-4" />
              <span>{showUploader ? "Hide Uploader" : "Upload Files"}</span>
            </Button>
          </div>
        }
      />

      {/* Storage Quota & Category Breakdown */}
      <FilesSummary />

      {/* Conditional File Uploader */}
      {showUploader && (
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <FileUploader />
        </div>
      )}

      {/* Folders Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <Tabs
          value={activeFolderId ?? "all"}
          onValueChange={(val) => setActiveFolderId(val === "all" ? null : val)}
        >
          <TabsList className="h-9">
            <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
              <HardDrive className="size-3.5" />
              <span>All Files</span>
            </TabsTrigger>
            {!foldersLoading &&
              folders?.map((folder) => (
                <TabsTrigger
                  key={folder.id}
                  value={folder.id}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Folder className="size-3.5" />
                  <span>{folder.name}</span>
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Primary Files Table */}
      <FilesTable />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a folder to group related documents and workspace assets.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor="folder-name" className="text-xs">
                Folder Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Legal Contracts, Invoices 2026"
                className="mt-1.5"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateFolderOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!folderName.trim() || createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
