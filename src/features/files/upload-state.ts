// Pure state transitions for the upload queue (kept separate from the zustand store so they are trivially testable).

export type UploadStatus = "queued" | "uploading" | "confirming" | "done" | "error" | "cancelled";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  /** 0-100, bytes sent to S3. */
  progress: number;
  status: UploadStatus;
  error?: string;
}

export const isFinished = (status: UploadStatus) =>
  status === "done" || status === "error" || status === "cancelled";

/** Returns the SAME array when nothing changed, so zustand skips notifying subscribers. */
export function patchItem(
  items: UploadItem[],
  id: string,
  patch: Partial<Omit<UploadItem, "id">>,
): UploadItem[] {
  let changed = false;
  const next = items.map((item) => {
    if (item.id !== id) return item;
    changed = true;
    return { ...item, ...patch };
  });
  return changed ? next : items;
}

export const removeItem = (items: UploadItem[], id: string): UploadItem[] =>
  items.filter((item) => item.id !== id);

export const clearFinished = (items: UploadItem[]): UploadItem[] =>
  items.filter((item) => !isFinished(item.status));
