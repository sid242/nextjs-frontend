"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, EyeIcon, FileIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { EmptyState } from "@/components/molecules/empty-state";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasTenantPermission, TENANT_PERMISSIONS, useTenantContext } from "@/features/tenants";
import { getErrorMessage } from "@/lib/api/errors";
import type { FileRecord } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/format";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { getDownloadUrl } from "../api";
import { triggerFileDownload } from "../download";
import { useDeleteFile, useFiles } from "../queries";
import { useFileRealtime } from "../use-file-realtime";
import { FilePreviewDialog } from "./file-preview-dialog";
import { FileStatusBadge } from "./file-status-badge";

type FileColumnId = "name" | "size" | "status" | "added" | "actions";

const FILE_COLUMNS: TableColumnDef<FileColumnId>[] = [
  { id: "name", label: "Name", canHide: false, defaultVisible: true },
  { id: "size", label: "Size", canHide: true, defaultVisible: true },
  { id: "status", label: "Status", canHide: true, defaultVisible: true },
  { id: "added", label: "Date Added", canHide: true, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const COLUMN_CONFIG: Record<FileColumnId, { label: string; className?: string }> = {
  name: { label: "Name" },
  size: { label: "Size" },
  status: { label: "Status" },
  added: { label: "Added" },
  actions: { label: "Actions", className: "text-right" },
};

export function FilesTable() {
  useFileRealtime();
  const { data: tenantContext } = useTenantContext();
  const canDelete = hasTenantPermission(
    tenantContext?.permissions,
    TENANT_PERMISSIONS.FILES_DELETE,
  );
  const { data, isPending, isError, error, refetch } = useFiles();
  const fileList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray((data as { data?: FileRecord[] }).data)) {
      return (data as { data: FileRecord[] }).data;
    }
    return [];
  }, [data]);
  const remove = useDeleteFile();

  const [toDelete, setToDelete] = useState<FileRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    syncSearchParam.run("");
  };

  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const handlePageSizeChange = (newSize: number) => {
    setParams(
      { limit: newSize === 10 ? null : newSize, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const filteredFiles = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return fileList;
    return fileList.filter((f) => f?.filename?.toLowerCase().includes(term));
  }, [fileList, searchInput]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, safePage, pageSize]);

  const tableColumns = useTableColumns<FileColumnId>({
    columns: FILE_COLUMNS,
    tableId: "files_table",
  });

  async function download(file: FileRecord) {
    try {
      const { url } = await getDownloadUrl(file.id, "attachment");
      await triggerFileDownload(url, file.filename);
      toast.success(`Downloading ${file.filename}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to download file."));
    }
  }

  function renderCell(colId: FileColumnId, file: FileRecord) {
    switch (colId) {
      case "name":
        return (
          <TableCell key="name" className="max-w-64 truncate font-medium" title={file?.filename}>
            <button
              type="button"
              onClick={() => setPreviewFile(file)}
              className="hover:text-primary max-w-full truncate text-left font-medium transition-colors hover:underline"
            >
              {file?.filename}
            </button>
          </TableCell>
        );
      case "size":
        return <TableCell key="size">{formatBytes(file?.size ?? 0)}</TableCell>;
      case "status":
        return (
          <TableCell key="status">
            <FileStatusBadge status={file?.status} />
          </TableCell>
        );
      case "added":
        return (
          <TableCell key="added" className="text-muted-foreground">
            {formatDate(file?.createdAt)}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key="actions" className="text-right">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Preview ${file?.filename}`}
              onClick={() => setPreviewFile(file)}
              title="Preview file directly"
            >
              <EyeIcon className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Download ${file?.filename}`}
              disabled={file?.status !== "UPLOADED"}
              onClick={() => void download(file)}
              title="Download file"
            >
              <DownloadIcon className="size-4" />
            </Button>
            {canDelete ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${file?.filename}`}
                onClick={() => setToDelete(file)}
                title="Delete file"
              >
                <Trash2Icon className="size-4" />
              </Button>
            ) : null}
          </TableCell>
        );
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

  if (fileList.length === 0) {
    return (
      <EmptyState
        icon={<FileIcon />}
        title="No files yet"
        description="Upload your first file to see it here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
          <Input
            placeholder="Filter files by name…"
            value={searchInput}
            onChange={handleSearchChange}
            className="h-8 pr-7 pl-8 text-xs"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2 p-0.5"
              aria-label="Clear search"
            >
              <XIcon className="size-3" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-muted-foreground text-xs font-medium">
            {filteredFiles.length} {filteredFiles.length === 1 ? "file" : "files"}
            {searchInput ? ` (filtered from ${fileList.length})` : ""}
          </p>
          <ColumnConfigDropdown tableColumns={tableColumns} />
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-sm font-medium">No files matching &ldquo;{searchInput}&rdquo;</p>
          <p className="text-muted-foreground pt-1 text-xs">
            Try adjusting your search terms or clear the filter.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs"
            onClick={() => setSearchInput("")}
          >
            Clear Filter
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.orderedVisibleColumns.map((colId) => {
                  const header = COLUMN_CONFIG[colId];
                  return (
                    <TableHead key={colId} className={header?.className}>
                      {header?.label}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFiles.map((file) => (
                <TableRow key={file?.id}>
                  {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, file))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredFiles.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={(p) =>
              setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
            }
            itemLabel="files"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
            onSettled: () => setToDelete(null),
          });
        }}
      />

      {/* In-browser File Preview Modal */}
      <FilePreviewDialog
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}
