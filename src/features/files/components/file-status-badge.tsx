import { Badge } from "@/components/ui/badge";
import type { FileScanStatus, FileStatus } from "@/lib/api/types";

const STATUS: Record<FileStatus, { label: string; variant: "success" | "warning" }> = {
  UPLOADED: { label: "Available", variant: "success" },
  PENDING: { label: "Pending", variant: "warning" },
};

export function FileStatusBadge({
  status,
  scanStatus,
}: {
  status: FileStatus;
  scanStatus?: FileScanStatus;
}) {
  if (scanStatus === "INFECTED") {
    return <Badge variant="destructive">Quarantined</Badge>;
  }
  if (scanStatus === "FAILED") return <Badge variant="destructive">Scan failed</Badge>;
  if (status === "UPLOADED" && scanStatus !== "CLEAN") {
    return (
      <Badge variant="warning">{scanStatus === "SKIPPED" ? "Unverified" : "Processing"}</Badge>
    );
  }
  const { label, variant } = STATUS[status] ?? { label: status, variant: "warning" };
  return <Badge variant={variant}>{label}</Badge>;
}
