"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  CornerLeftUp,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  HardDrive,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreateFolderDialog,
  FilesSummary,
  FilesTable,
  FileUploader,
  getFolderBreadcrumbTrail,
  getFolderPath,
  getSubfolders,
  MoveFolderDialog,
  RenameFolderDialog,
  useDeleteFolder,
  useFolders,
} from "@/features/files";
import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  TenantPermissionGate,
  useActiveTenant,
  useTenantContext,
} from "@/features/tenants";
import type { FileFolderRecord } from "@/lib/api/types";
import { useSearchQueryParams } from "@/lib/hooks";

interface FolderModalState {
  mode: "create" | "rename" | "move" | "delete" | null;
  folder?: FileFolderRecord | null;
}

export default function FilesPage() {
  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.FILES_READ}>
      <WorkspaceFiles />
    </TenantPermissionGate>
  );
}

function WorkspaceFiles() {
  const { activeTenant } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenant?.id ?? null);
  const canWrite = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.FILES_UPLOAD);
  const canDelete = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.FILES_DELETE);

  const { get, setParam } = useSearchQueryParams();
  const activeFolderId = get("folder") || null;
  const setActiveFolderId = (id: string | null) => {
    setParam("folder", id || null, { mode: "push", scroll: false });
  };

  const [showUploader, setShowUploader] = useState(false);

  // Cohesive modal state (Rule: cohesive-state.md)
  const [folderModal, setFolderModal] = useState<FolderModalState>({ mode: null });

  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const deleteFolderMutation = useDeleteFolder();

  const breadcrumbTrail = useMemo(
    () => getFolderBreadcrumbTrail(activeFolderId, folders),
    [activeFolderId, folders],
  );

  const activeFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return breadcrumbTrail.length > 0
      ? breadcrumbTrail[breadcrumbTrail.length - 1]
      : (folders.find((f) => f.id === activeFolderId) ?? null);
  }, [activeFolderId, breadcrumbTrail, folders]);

  const activeFolderPath = useMemo(() => {
    if (!activeFolder) return "Root (All Files)";
    return getFolderPath(activeFolder.id, folders);
  }, [activeFolder, folders]);

  const currentSubfolders = useMemo(
    () => getSubfolders(activeFolderId, folders),
    [activeFolderId, folders],
  );

  const handleDeleteFolder = async () => {
    if (!folderModal.folder) return;
    const targetFolder = folderModal.folder;

    try {
      await deleteFolderMutation.mutateAsync(targetFolder.id);
      toast.success(`Folder "${targetFolder.name}" deleted. Files inside were preserved.`);
      if (activeFolderId === targetFolder.id) {
        setActiveFolderId(targetFolder.parentId ?? null);
      }
      setFolderModal({ mode: null });
    } catch {
      toast.error("Failed to delete folder. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files & Storage"
        description={`Secure document management and storage for ${activeTenant?.name ?? "your workspace"}.`}
        actions={
          canWrite ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFolderModal({ mode: "create" })}
                className="flex items-center gap-1.5"
              >
                <FolderPlus className="size-4" />
                <span>{activeFolder ? "New Subfolder" : "New Folder"}</span>
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
          ) : undefined
        }
      />

      {/* Storage Quota & Category Breakdown */}
      <FilesSummary />

      {/* Conditional File Uploader */}
      {canWrite && showUploader && (
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground text-xs font-medium">
              Target Destination: <strong className="text-foreground">{activeFolderPath}</strong>
            </span>
            {activeFolder && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Folder className="size-3" />
                {activeFolder.name}
              </Badge>
            )}
          </div>
          <FileUploader folderId={activeFolderId} />
        </div>
      )}

      {/* Breadcrumb Navigation & Active Folder Control */}
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          {activeFolder && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveFolderId(activeFolder.parentId ?? null)}
              className="mr-1 size-7 rounded-lg"
              title={activeFolder.parentId ? "Go to parent folder" : "Go to All Files"}
            >
              <CornerLeftUp className="size-3.5" />
            </Button>
          )}

          <button
            onClick={() => setActiveFolderId(null)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${
              !activeFolderId
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HardDrive className="size-3.5" />
            <span>All Files</span>
          </button>

          {breadcrumbTrail.map((folder, idx) => {
            const isLast = idx === breadcrumbTrail.length - 1;
            return (
              <div key={folder.id} className="flex items-center gap-1.5">
                <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
                {isLast ? (
                  <div className="bg-background text-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold shadow-xs">
                    <FolderOpen className="text-primary size-3.5 shrink-0" />
                    <span className="max-w-[200px] truncate">{folder.name}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
                  >
                    <Folder className="size-3.5 shrink-0" />
                    <span className="max-w-[150px] truncate">{folder.name}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {activeFolder && (canWrite || canDelete) ? (
          <div className="flex items-center gap-1.5">
            {canWrite && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFolderModal({ mode: "rename", folder: activeFolder })}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Pencil className="size-3" />
                  <span>Rename</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFolderModal({ mode: "move", folder: activeFolder })}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <FolderInput className="size-3" />
                  <span>Move</span>
                </Button>
              </>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFolderModal({ mode: "delete", folder: activeFolder })}
                className="text-destructive hover:text-destructive h-7 gap-1 px-2 text-xs"
              >
                <Trash2 className="size-3" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">
            {folders.length} {folders.length === 1 ? "folder" : "folders"} in workspace
          </div>
        )}
      </div>

      {/* Subfolders Explorer Grid */}
      {!foldersLoading && currentSubfolders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {activeFolder ? "Subfolders" : "Folders"} ({currentSubfolders.length})
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setFolderModal({ mode: "create" })}
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <FolderPlus className="size-3" />
                <span>Add {activeFolder ? "Subfolder" : "Folder"}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {currentSubfolders.map((folder) => (
              <Card
                key={folder.id}
                className="group border-border/70 hover:border-primary/50 relative cursor-pointer transition-all hover:shadow-xs"
                onClick={() => setActiveFolderId(folder.id)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className="text-primary fill-primary/10 size-5 shrink-0" />
                    <span className="truncate text-xs font-medium" title={folder.name}>
                      {folder.name}
                    </span>
                  </div>

                  {(canWrite || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground size-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderId(folder.id);
                          }}
                        >
                          <FolderOpen className="mr-2 size-3.5" />
                          Open
                        </DropdownMenuItem>
                        {canWrite && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderModal({ mode: "rename", folder });
                            }}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Rename
                          </DropdownMenuItem>
                        )}
                        {canWrite && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderModal({ mode: "move", folder });
                            }}
                          >
                            <FolderInput className="mr-2 size-3.5" />
                            Move
                          </DropdownMenuItem>
                        )}
                        {canWrite && canDelete && <DropdownMenuSeparator />}
                        {canDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderModal({ mode: "delete", folder });
                            }}
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Primary Files Table (Filtered by activeFolderId) */}
      <FilesTable folderId={activeFolderId} onNavigateFolder={setActiveFolderId} />

      {/* Create Folder / Subfolder Dialog */}
      <CreateFolderDialog
        open={canWrite && folderModal.mode === "create"}
        onOpenChange={(open) => !open && setFolderModal({ mode: null })}
        parentFolderId={activeFolderId}
        parentFolderName={activeFolder?.name}
      />

      {/* Rename Folder Dialog */}
      <RenameFolderDialog
        folder={folderModal.folder ?? null}
        open={canWrite && folderModal.mode === "rename"}
        onOpenChange={(open) => !open && setFolderModal({ mode: null })}
      />

      {/* Move Folder Dialog */}
      <MoveFolderDialog
        folder={folderModal.folder ?? null}
        allFolders={folders}
        open={canWrite && folderModal.mode === "move"}
        onOpenChange={(open) => !open && setFolderModal({ mode: null })}
      />

      {/* Delete Folder Confirmation Dialog */}
      <ConfirmDialog
        open={canDelete && folderModal.mode === "delete"}
        onOpenChange={(open) => !open && setFolderModal({ mode: null })}
        title={`Delete folder "${folderModal.folder?.name}"?`}
        description="This will permanently delete the folder and its subfolders. Files inside will NOT be deleted; they will be moved to Root (All Files)."
        confirmLabel="Delete Folder"
        destructive
        pending={deleteFolderMutation.isPending}
        onConfirm={handleDeleteFolder}
      />
    </div>
  );
}
