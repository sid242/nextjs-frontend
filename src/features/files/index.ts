// Public API of the files feature. Everything else in this folder is private.
export { FileUploader } from "./components/file-uploader";
export { FilesTable } from "./components/files-table";
export { FilesSummary } from "./components/files-summary";
// Server-only: import this barrel from server components (routes) only, never from client components.
export { prefetchFiles } from "./server";
