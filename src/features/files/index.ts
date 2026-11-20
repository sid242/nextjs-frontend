// Public API of the files feature. Everything else in this folder is private.
export { FileUploader } from "./components/file-uploader";
export { FilesTable } from "./components/files-table";
export { FilesSummary } from "./components/files-summary";
export { RecentFilesCard } from "./components/recent-files-card";
export { FilePreviewDialog } from "./components/file-preview-dialog";
export { FileStatusBadge } from "./components/file-status-badge";

export {
  useFiles,
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useDeleteFile,
  useRestoreFile,
  useUpdateFile,
  useStorageStats,
  useFileShares,
  useCreateFileShare,
  useRevokeFileShare,
  useFileVersions,
  useRestoreFileVersion,
} from "./queries";

export { useUploadFiles } from "./use-upload-files";
export { useFileRealtime } from "./use-file-realtime";

// Server-only: import this barrel from server components (routes) only, never from client components.
export { prefetchFiles } from "./server";

export { triggerFileDownload } from "./download";
export { useFileSse } from "./use-file-sse";
