"use client";

import * as React from "react";
import { DownloadIcon, FileIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { EmptyState } from "@/components/molecules/empty-state";
import { getErrorMessage } from "@/lib/api/errors";
import type { FileRecord } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/format";
import { getDownloadUrl } from "../api";
import { useDeleteFile, useFiles } from "../queries";
import { useFileRealtime } from "../use-file-realtime";
import { FileStatusBadge } from "./file-status-badge";

function openInNewTab(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

export function FilesTable() {
  useFileRealtime();
  const { data, isPending, isError, error, refetch } = useFiles();
  const remove = useDeleteFile();
  const [toDelete, setToDelete] = React.useState<FileRecord | null>(null);

  async function download(file: FileRecord) {
    try {
      openInNewTab((await getDownloadUrl(file.id)).url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (isPending) {
    return (
      <div className="grid gap-2" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center gap-3">
          {getErrorMessage(error, "Could not load your files.")}
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<FileIcon />}
        title="No files yet"
        description="Upload your first file to see it here."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="max-w-64 truncate font-medium" title={file.filename}>
                {file.filename}
              </TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell>
                <FileStatusBadge status={file.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(file.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Download ${file.filename}`}
                  disabled={file.status !== "UPLOADED"}
                  onClick={() => void download(file)}
                >
                  <DownloadIcon />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${file.filename}`}
                  onClick={() => setToDelete(file)}
                >
                  <Trash2Icon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete file?"
        description={`"${toDelete?.filename ?? ""}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          remove.mutate(toDelete.id, {
            onSuccess: () => toast.success("File deleted"),
            onSettled: () => setToDelete(null), // failures show the global error toast and the row is restored
          });
        }}
      />
    </>
  );
}
