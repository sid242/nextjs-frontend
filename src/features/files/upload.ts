import type { PresignedPost } from "@/lib/api/types";
import { resolveStorageUrl } from "@/lib/storage";

/**
 * Upload straight from the browser to S3 with the presigned POST (files never pass through our servers).
 * XMLHttpRequest is used because fetch() can't report upload progress.
 */
export function uploadToS3(
  post: PresignedPost,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(post.fields)) form.append(key, value);
    form.append("file", file); // S3 requires the file to be the LAST field

    const targetUrl = resolveStorageUrl(post.url);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", targetUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
        let s3Message = "";
        try {
          if (parser && xhr.responseText) {
            const xml = parser.parseFromString(xhr.responseText, "application/xml");
            s3Message = xml.querySelector("Message")?.textContent ?? "";
          }
        } catch {
          /* fallback */
        }
        reject(new Error(s3Message || `Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}
