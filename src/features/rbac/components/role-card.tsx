import { Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Role } from "../schemas";

export function ActionBadge({ action, permKey }: { action?: string; permKey?: string }) {
  const act = (action ?? permKey?.split(":")[1] ?? "manage").toLowerCase();
  if (act === "read" || act === "view") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
        Read
      </span>
    );
  }
  if (act === "create" || act === "write" || act === "upload") {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
        Create
      </span>
    );
  }
  if (act === "update" || act === "edit") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
        Update
      </span>
    );
  }
  if (act === "delete" || act === "remove") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">
        Delete
      </span>
    );
  }
  if (act === "invite") {
    return (
      <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-600 uppercase dark:text-cyan-400">
        Invite
      </span>
    );
  }
  if (act === "assign") {
    return (
      <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-violet-600 uppercase dark:text-violet-400">
        Assign
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
      {action ?? "Manage"}
    </span>
  );
}

interface RoleCardProps {
  role: Role;
  onDelete?: (roleId: string, roleName: string) => void;
}

export function RoleCard({ role, onDelete }: RoleCardProps) {
  return (
    <Card className="border-border/60 transition-all hover:shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-base font-semibold">{role?.name}</CardTitle>
            {role?.isSystem ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                System Role
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                Custom Role
              </Badge>
            )}
            <span className="text-muted-foreground/70 text-xs">
              {role?.usersCount ?? 0} assigned
            </span>
          </div>
          {role?.description && (
            <CardDescription className="text-xs">{role?.description}</CardDescription>
          )}
        </div>

        {!role?.isSystem && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={() => onDelete(role?.id, role?.name)}
            aria-label={`Delete ${role?.name}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {role?.permissions?.map((perm: string) => (
            <Badge
              key={perm}
              variant="outline"
              className="border-border/50 bg-muted/40 text-[11px] font-normal"
            >
              {perm}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
