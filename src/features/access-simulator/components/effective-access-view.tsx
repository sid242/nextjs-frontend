"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  LayersIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffectiveAccess } from "../queries";

interface EffectiveAccessViewProps {
  tenantId: string;
  userId: string;
}

export function EffectiveAccessView({ tenantId, userId }: EffectiveAccessViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { data, isLoading } = useEffectiveAccess(tenantId, userId);

  const filteredPermissions = React.useMemo(() => {
    if (!data?.permissionsProvenance) return [];
    if (!searchTerm.trim()) return data.permissionsProvenance;
    const term = searchTerm.toLowerCase();
    return data.permissionsProvenance.filter(
      (p) =>
        p.key.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.moduleName && p.moduleName.toLowerCase().includes(term)),
    );
  }, [data, searchTerm]);

  if (isLoading) {
    return (
      <Card className="shadow-xs">
        <CardContent className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          Resolving effective permissions and group inheritance...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-xs">
        <CardContent className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          No effective access profile found for this member.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheckIcon className="text-primary h-5 w-5" />
                Effective Access Profile: {data.user.name || data.user.email}
              </CardTitle>
              <CardDescription>
                Consolidated permissions calculated across direct member roles and active user group
                memberships.
              </CardDescription>
            </div>

            {data.isEffectiveActive ? (
              <Badge
                variant="outline"
                className="w-fit border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2Icon className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                Active Access
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="w-fit border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <AlertTriangleIcon className="mr-1 h-3.5 w-3.5 text-amber-600" />
                Access Suspended
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {data.overallDenialReason && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{data.overallDenialReason}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Direct Roles */}
            <div className="bg-muted/20 space-y-2 rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <ShieldCheckIcon className="text-primary h-4 w-4" />
                Direct Roles ({data.directRoles?.length ?? 0})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(data.directRoles?.length ?? 0) === 0 ? (
                  <span className="text-muted-foreground text-xs italic">
                    No direct roles assigned
                  </span>
                ) : (
                  data.directRoles?.map((r) => (
                    <Badge key={r.id} variant="secondary">
                      {r.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* User Groups */}
            <div className="bg-muted/20 space-y-2 rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <UsersIcon className="h-4 w-4 text-sky-600" />
                User Groups ({data.groups?.length ?? 0})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(data.groups?.length ?? 0) === 0 ? (
                  <span className="text-muted-foreground text-xs italic">No group memberships</span>
                ) : (
                  data.groups?.map((g) => (
                    <Badge
                      key={g.id}
                      variant="outline"
                      className="border-sky-500/30 text-sky-700 dark:text-sky-300"
                    >
                      {g.name} ({g.roles?.length ?? 0} roles)
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix with Provenance */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayersIcon className="text-primary h-4 w-4" />
              Effective Permissions Matrix ({data.effectivePermissions?.length ?? 0} active)
            </CardTitle>
            <CardDescription>
              Every permission granted to this user with verified direct or group inheritance
              provenance.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Filter permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  <TableHead>Module / Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source & Provenance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground h-20 text-center text-xs"
                    >
                      No permissions match your search filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((perm) => (
                    <TableRow key={perm.key}>
                      <TableCell>
                        <div className="text-xs font-semibold">{perm.name}</div>
                        <div className="text-muted-foreground font-mono text-xs">{perm.key}</div>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-xs">
                        {perm.moduleName || perm.moduleKey || "Core"}
                      </TableCell>

                      <TableCell>
                        {perm.isAllowed ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                          >
                            <ShieldCheckIcon className="mr-1 h-3 w-3" />
                            Allowed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            <ShieldXIcon className="mr-1 h-3 w-3" />
                            Denied
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {perm.sources?.map((s, idx) => (
                            <Badge
                              key={`${s.roleId}-${idx}`}
                              variant={s.source === "DIRECT" ? "secondary" : "outline"}
                              className={
                                s.source === "GROUP"
                                  ? "border-sky-500/40 text-[11px] text-sky-700 dark:text-sky-300"
                                  : "text-[11px]"
                              }
                            >
                              {s.source === "GROUP"
                                ? `Group "${s.groupName}" → ${s.roleName}`
                                : `Direct: ${s.roleName}`}
                            </Badge>
                          ))}
                        </div>
                        {perm.denialReason && (
                          <div className="mt-1 text-[11px] text-amber-600 italic">
                            Reason: {perm.denialReason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
