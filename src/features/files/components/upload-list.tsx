"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/format";
import { cancelUpload } from "../use-upload-files";
import { isFinished, type UploadItem } from "../upload-state";
import { useUploadStore } from "../upload-store";

function statusText(item: UploadItem): string {
  switch (item.status) {
    case "queued":
      return "Waiting…";
    case "uploading":
      return `${item.progress}%`;
    case "confirming":
      return "Finishing…";
    case "done":
      return "Uploaded";
    case "error":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}

export function UploadList() {
  const items = useUploadStore((state) => state.items);
  const remove = useUploadStore((state) => state.remove);
  const clearFinished = useUploadStore((state) => state.clearFinished);

  if (items.length === 0) return null;
  const hasFinished = items.some((item) => isFinished(item.status));

  return (
    <div className="grid gap-3 rounded-lg border p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Uploads</p>
        {hasFinished ? (
          <Button variant="ghost" size="sm" onClick={clearFinished}>
            Clear finished
          </Button>
        ) : null}
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate" title={item.name}>
                {item.name}{" "}
                <span className="text-muted-foreground">· {formatBytes(item.size)}</span>
              </span>
              <span className="text-muted-foreground flex shrink-0 items-center gap-1">
                {statusText(item)}
                {isFinished(item.status) ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Dismiss ${item.name}`}
                    onClick={() => remove(item.id)}
                  >
                    <XIcon />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => cancelUpload(item.id)}>
                    Cancel
                  </Button>
                )}
              </span>
            </div>
            {isFinished(item.status) ? null : (
              <Progress value={item.progress} aria-label={`Uploading ${item.name}`} />
            )}
            {item.status === "error" && item.error ? (
              <p className="text-destructive text-xs">{item.error}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
