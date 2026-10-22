"use client";

import { useMemo, useState } from "react";
import { Code2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/errors";

import { usePlatformAuditLogs } from "../queries";
import type { PlatformAuditLog } from "../schemas";

export function AuditLogsTable() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [inspectLog, setInspectLog] = useState<PlatformAuditLog | null>(null);

  const { data: auditData, isLoading, error } = usePlatformAuditLogs({ limit: 100 });

  const filteredLogs = useMemo(() => {
    return (auditData?.items ?? []).filter((log) => {
      const matchesSearch =
        (log?.action ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (log?.staffEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (log?.targetType ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (log?.tenantId ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === "ALL" || log?.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditData?.items, search, actionFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    for (const log of auditData?.items ?? []) {
      if (log?.action) set.add(log.action);
    }
    return Array.from(set);
  }, [auditData?.items]);

  const getActionBadge = (action: string) => {
    if (action.startsWith("tenant_support")) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/5 font-mono text-[10px] text-emerald-500"
        >
          {action}
        </Badge>
      );
    }
    if (action.startsWith("platform_role")) {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/5 font-mono text-[10px] text-amber-500"
        >
          {action}
        </Badge>
      );
    }
    if (action.startsWith("platform_staff")) {
      return (
        <Badge
          variant="outline"
          className="border-red-500/40 bg-red-500/5 font-mono text-[10px] text-red-500"
        >
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-mono text-[10px]">
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Audit Trail</h1>
          <p className="text-muted-foreground text-sm">
            Immutable compliance record of internal SaaS staff operations and delegated tenant
            sessions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="relative w-full md:w-80">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search action, staff email, target ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 w-full text-xs md:w-56">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  {uniqueActions.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-destructive p-8 text-center text-sm">
              Failed to load platform audit trail: {getErrorMessage(error)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-muted-foreground p-12 text-center text-sm">
              No platform audit events matching your filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="font-mono text-xs uppercase">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Staff Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Scope</TableHead>
                  <TableHead>Client Origin</TableHead>
                  <TableHead className="text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground font-semibold">
                          {log.staffDisplayName ?? "System"}
                        </span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {log.staffEmail ??
                            (log.actorStaffId ? log.actorStaffId.slice(0, 8) : "daemon")}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{getActionBadge(log.action)}</TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {log.tenantId && (
                          <div className="font-mono text-[10px] text-emerald-500">
                            tenant: {log.tenantId.slice(0, 8)}...
                          </div>
                        )}
                        {log.targetType && (
                          <div className="text-muted-foreground font-mono text-[10px]">
                            {log.targetType}:{log.targetId ? log.targetId.slice(0, 8) : ""}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-[10px]">
                      {log.ipAddress ?? "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {log.metadata ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectLog(log)}
                          className="text-muted-foreground hover:text-foreground h-7 gap-1 font-mono text-xs"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          Inspect
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* JSON Payload Inspection Modal */}
      <Dialog open={Boolean(inspectLog)} onOpenChange={(open) => !open && setInspectLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm">
              <Code2 className="h-4 w-4 text-red-500" />
              Audit Payload &bull; {inspectLog?.action}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Event ID: {inspectLog?.id} &bull; Request: {inspectLog?.requestId ?? "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-muted/40 max-h-80 overflow-x-auto rounded-lg border p-3 font-mono text-xs">
              <pre className="text-foreground text-[11px] leading-relaxed">
                {JSON.stringify(inspectLog?.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
