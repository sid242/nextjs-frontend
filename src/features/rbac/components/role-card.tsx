import { Lock, Shield, ShieldCheck, Trash2Icon, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Role } from "../schemas";

export function ActionBadge({ action, permKey }: { action?: string; permKey?: string }) {
  const act = (action ?? permKey?.split(":")[1] ?? "manage").toLowerCase();
  if (act === "read" || act === "view") {
    return (
      <span className="inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
        Read
      </span>
    );
  }
  if (act === "create" || act === "write" || act === "upload") {
    return (
      <span className="inline-flex items-center rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
        Create
      </span>
    );
  }
  if (act === "update" || act === "edit") {
    return (
      <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
        Update
      </span>
    );
  }
  if (act === "delete" || act === "remove") {
    return (
      <span className="inline-flex items-center rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
        Delete
      </span>
    );
  }
  if (act === "invite") {
    return (
      <span className="inline-flex items-center rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-cyan-600 uppercase dark:text-cyan-400">
        Invite
      </span>
    );
  }
  if (act === "assign") {
    return (
      <span className="inline-flex items-center rounded border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-violet-600 uppercase dark:text-violet-400">
        Assign
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400">
      {action ?? "Manage"}
    </span>
  );
}

interface RoleCardProps {
  role: Role;
  onDelete?: (roleId: string, roleName: string) => void;
}

export function RoleCard({ role, onDelete }: RoleCardProps) {
  const isWildcard = role?.permissions?.includes("*");
  const permissionsList = role?.permissions ?? [];

  return (
    <Card className="border-border/70 bg-card/60 hover:border-border rounded-2xl shadow-xs transition-all hover:shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
              role?.isSystem
                ? "bg-muted text-muted-foreground border-border/80"
                : "bg-primary/10 text-primary border-primary/20",
            )}
          >
            {role?.isSystem ? <Lock className="size-4" /> : <ShieldCheck className="size-4" />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-foreground text-base font-bold tracking-tight">
                {role?.name}
              </CardTitle>

              {role?.isSystem ? (
                <Badge
                  variant="outline"
                  className="border-muted h-5 gap-1 px-1.5 font-mono text-[9px]"
                >
                  <Lock className="size-2.5" /> SYSTEM
                </Badge>
              ) : (
                <Badge variant="secondary" className="h-5 px-1.5 font-mono text-[9px]">
                  CUSTOM
                </Badge>
              )}

              <Badge
                variant="outline"
                className="text-muted-foreground h-5 gap-1 font-mono text-[10px]"
              >
                <Users className="size-2.5" /> {role?.usersCount ?? 0} assigned
              </Badge>
            </div>

            {role?.description && (
              <CardDescription className="text-xs leading-relaxed">
                {role?.description}
              </CardDescription>
            )}
          </div>
        </div>

        {!role?.isSystem && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 rounded-lg"
            onClick={() => onDelete(role?.id, role?.name)}
            aria-label={`Delete ${role?.name}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="border-border/40 border-t pt-2">
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
            <span>
              Granted Permissions ({isWildcard ? "Full Wildcard Authority" : permissionsList.length}
              )
            </span>
            {isWildcard && (
              <span className="font-mono text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Full System Superuser (*)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isWildcard ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <Shield className="size-3.5" /> Wildcard Superuser Authority (*)
              </span>
            ) : permissionsList.length === 0 ? (
              <span className="text-muted-foreground text-xs italic">
                No active permissions assigned to this role.
              </span>
            ) : (
              permissionsList.map((perm: string) => {
                const parts = perm.split(":");
                const resource = parts[0] ?? perm;
                const action = parts[1] ?? "";

                return (
                  <div
                    key={perm}
                    className="border-border/60 bg-muted/30 text-foreground inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs"
                  >
                    <span className="font-mono text-[11px]">{resource}</span>
                    {action && <ActionBadge action={action} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
