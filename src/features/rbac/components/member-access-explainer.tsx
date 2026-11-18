"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lock,
  Shield,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useExplainMemberAccess, usePermissions } from "../queries";

interface MemberAccessExplainerProps {
  tenantId: string;
  memberId: string;
}

const COMMON_PERMISSIONS = [
  { key: "files:read", name: "Read Files", module: "File Storage" },
  { key: "files:upload", name: "Upload Files", module: "File Storage" },
  { key: "members:read", name: "View Members", module: "Team & Members" },
  { key: "members:invite", name: "Invite Members", module: "Team & Members" },
  { key: "members:delete", name: "Remove Members", module: "Team & Members" },
  { key: "roles:read", name: "View Roles", module: "Access Control & Roles" },
  { key: "roles:create", name: "Create Roles", module: "Access Control & Roles" },
  { key: "roles:assign", name: "Assign Roles", module: "Access Control & Roles" },
  { key: "audit:read", name: "Read Audit Trail", module: "Security & Audit" },
  { key: "tenants:update", name: "Update Workspace", module: "Workspace" },
];

export function MemberAccessExplainer({ tenantId, memberId }: MemberAccessExplainerProps) {
  const { data: platformPermissions = [] } = usePermissions();
  const [selectedPermission, setSelectedPermission] = useState<string>("files:read");

  const {
    data: explanation,
    isLoading,
    isError,
  } = useExplainMemberAccess(tenantId, memberId, selectedPermission);

  const permissionOptions =
    platformPermissions.length > 0
      ? platformPermissions.map((p) => ({
          key: p.key,
          name: p.name,
          module: p.category ?? "General",
        }))
      : COMMON_PERMISSIONS;

  return (
    <div className="border-border/70 bg-accent/10 space-y-3 rounded-xl border p-3">
      <div>
        <h4 className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
          <HelpCircle className="text-primary size-3.5" /> Permission Access Explainer
        </h4>
        <p className="text-muted-foreground text-[11px]">
          Trace exact authorization reasoning, role assignments, and group inheritance for any
          permission.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground text-[11px] font-medium">Inspect Permission</label>
        <Select value={selectedPermission} onValueChange={setSelectedPermission}>
          <SelectTrigger className="h-8 font-mono text-xs">
            <SelectValue placeholder="Select permission" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {permissionOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key} className="text-xs">
                <span className="font-mono font-medium">{opt.key}</span>
                <span className="text-muted-foreground ml-2 text-[10px]">({opt.name})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2 pt-1">
          <Skeleton className="h-7 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <div className="border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-2.5 text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Unable to trace access rules for this permission.</span>
        </div>
      ) : explanation ? (
        <div className="space-y-2.5 pt-1">
          <div className="border-border/60 bg-background/80 flex items-center justify-between rounded-lg border px-2.5 py-1.5">
            <span className="text-muted-foreground text-xs font-medium">Effective Decision:</span>
            {explanation.allowed ? (
              <Badge className="gap-1 bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
                <CheckCircle2 className="size-3" /> ALLOWED
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <XCircle className="size-3" /> DENIED
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Provenance & Reasoning Trail
            </span>
            <div className="space-y-1.5">
              {explanation.reasons?.map((reason, idx) => (
                <div
                  key={idx}
                  className="border-border/50 bg-background/60 space-y-1 rounded-lg border p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                      {reason.source === "OWNER" && (
                        <Shield className="size-3 text-purple-600 dark:text-purple-400" />
                      )}
                      {reason.source === "DIRECT_ROLE" && (
                        <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
                      )}
                      {reason.source === "GROUP_ROLE" && (
                        <Users className="size-3 text-cyan-600 dark:text-cyan-400" />
                      )}
                      {reason.source === "MODULE_DISABLED" && (
                        <Lock className="size-3 text-amber-600 dark:text-amber-400" />
                      )}
                      {reason.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`h-4 px-1 py-0 font-mono text-[9px] ${
                        reason.granted
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {reason.source}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {reason.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
