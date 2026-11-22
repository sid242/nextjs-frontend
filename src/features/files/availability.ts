import type { FileRecord } from "@/lib/api/types";

export function isFileAvailable(file: Pick<FileRecord, "status" | "scanStatus">): boolean {
  return file.status === "UPLOADED" && file.scanStatus === "CLEAN";
}
