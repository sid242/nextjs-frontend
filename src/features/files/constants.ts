// Keep in sync with the backend (ALLOWED_TYPES in files.service.js and S3_MAX_UPLOAD_MB).
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export const MAX_UPLOAD_MB = 10;
export const FILE_INPUT_ACCEPT = ALLOWED_FILE_TYPES.join(",");

/** Uploads run in parallel up to this many at once; the rest wait in the queue. */
export const UPLOAD_CONCURRENCY = 3;
/** Files accepted per drop/selection. The backend rate-limits upload-url requests per user. */
export const MAX_FILES_PER_BATCH = 10;
