import { Badge } from "@/components/ui/badge";

import type { GroupStatus } from "../types";

interface GroupStatusBadgeProps {
  status: GroupStatus;
}

export function GroupStatusBadge({ status }: GroupStatusBadgeProps) {
  if (status === "ARCHIVED") {
    return (
      <Badge variant="secondary" className="border-border text-muted-foreground font-medium">
        Archived
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="font-medium">
      Active
    </Badge>
  );
}
