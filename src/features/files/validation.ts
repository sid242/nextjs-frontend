import { ALLOWED_FILE_TYPES, MAX_UPLOAD_MB } from "./constants";

/** Client-side pre-check for fast feedback. The backend + S3 policy remain the real enforcement. */
export function validateFile(file: { name: string; type: string; size: number }): string | null {
  if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) {
    return `"${file.name}" isn't a supported type. Use JPG, PNG, WebP or PDF.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    return `"${file.name}" is larger than ${MAX_UPLOAD_MB} MB.`;
  return null;
}
