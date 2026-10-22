// Public API of the files feature. Everything else in this folder is private.
export { FileUploader } from "./components/file-uploader";
export { FilesTable } from "./components/files-table";
export { FilesSummary } from "./components/files-summary";
export { RecentFilesCard } from "./components/recent-files-card";
export { FilePreviewDialog } from "./components/file-preview-dialog";

// Server-only: import this barrel from server components (routes) only, never from client components.
export { prefetchFiles } from "./server";

export { triggerFileDownload } from "./download";
