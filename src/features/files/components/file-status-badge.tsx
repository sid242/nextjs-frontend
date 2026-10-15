import { Badge } from "@/components/ui/badge";
import type { FileStatus } from "@/lib/api/types";

const STATUS: Record<FileStatus, { label: string; variant: "success" | "warning" }> = {
  UPLOADED: { label: "Uploaded", variant: "success" },
  PENDING: { label: "Pending", variant: "warning" },
};

export function FileStatusBadge({ status }: { status: FileStatus }) {
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
