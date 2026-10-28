"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Code2, Search } from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
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
import { formatDate } from "@/lib/format";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { usePlatformAuditLogs } from "../queries";
import type { PlatformAuditLog } from "../schemas";

type AuditLogColumnId = "timestamp" | "actor" | "action" | "target" | "origin" | "payload";

const AUDIT_LOG_COLUMNS: TableColumnDef<AuditLogColumnId>[] = [
  { id: "timestamp", label: "Timestamp", canHide: false, defaultVisible: true },
  { id: "actor", label: "Staff Actor", canHide: true, defaultVisible: true },
  { id: "action", label: "Action", canHide: false, defaultVisible: true },
  { id: "target", label: "Target Scope", canHide: true, defaultVisible: true },
  { id: "origin", label: "Client Origin", canHide: true, defaultVisible: true },
  { id: "payload", label: "Payload", canHide: false, defaultVisible: true },
];

const AUDIT_LOG_COLUMN_LABELS: Record<AuditLogColumnId, string> = {
  timestamp: "Timestamp",
  actor: "Staff Actor",
  action: "Action",
  target: "Target Scope",
  origin: "Client Origin",
  payload: "Payload",
};

export function AuditLogsTable() {
  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const actionFilter = get("action") ?? "ALL";
  const handleActionChange = (val: string) => {
    setParams(
      { action: val === "ALL" ? null : val, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const [inspectLog, setInspectLog] = useState<PlatformAuditLog | null>(null);
  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const handlePageSizeChange = (newSize: number) => {
    setParams(
      { limit: newSize === 10 ? null : newSize, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const { data: auditData, isLoading, error } = usePlatformAuditLogs({ limit: 100 });

  const filteredLogs = useMemo(() => {
    const query = searchInput.toLowerCase();
    return (auditData?.items ?? []).filter((log) => {
      const matchesSearch =
        (log?.action ?? "").toLowerCase().includes(query) ||
        (log?.staffEmail ?? "").toLowerCase().includes(query) ||
        (log?.targetType ?? "").toLowerCase().includes(query) ||
        (log?.tenantId ?? "").toLowerCase().includes(query);

      const matchesAction = actionFilter === "ALL" || log?.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditData?.items, searchInput, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safePage, pageSize]);

  const tableColumns = useTableColumns<AuditLogColumnId>({
    columns: AUDIT_LOG_COLUMNS,
    tableId: "platform_audit_logs_table",
  });

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
          className="border-indigo-500/40 bg-indigo-500/5 font-mono text-[10px] text-indigo-600 dark:text-indigo-400"
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

  function renderCell(colId: AuditLogColumnId, log: PlatformAuditLog) {
    switch (colId) {
      case "timestamp":
        return (
          <TableCell key="timestamp" className="text-muted-foreground text-xs whitespace-nowrap">
            {formatDate(log.createdAt)}
          </TableCell>
        );
      case "actor":
        return (
          <TableCell key="actor">
            <div className="flex flex-col">
              <span className="text-foreground font-semibold">
                {log.staffDisplayName ?? "System"}
              </span>
              <span className="text-muted-foreground font-mono text-[10px]">
                {log.staffEmail ?? (log.actorStaffId ? log.actorStaffId.slice(0, 8) : "daemon")}
              </span>
            </div>
          </TableCell>
        );
      case "action":
        return <TableCell key="action">{getActionBadge(log.action)}</TableCell>;
      case "target":
        return (
          <TableCell key="target">
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
        );
      case "origin":
        return (
          <TableCell key="origin" className="text-muted-foreground font-mono text-[10px]">
            {log.ipAddress ?? "—"}
          </TableCell>
        );
      case "payload":
        return (
          <TableCell key="payload" className="text-right">
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
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Audit Trail</h1>
          <p className="text-muted-foreground text-xs">
            Immutable compliance record of internal SaaS staff operations and delegated tenant
            sessions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="relative w-full sm:flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search action, staff email, target ID…"
                value={searchInput}
                onChange={handleSearchChange}
                className="h-10 rounded-xl pl-9 text-xs"
              />
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Select value={actionFilter} onValueChange={handleActionChange}>
                <SelectTrigger className="h-10 w-full rounded-xl text-xs sm:w-56">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="rounded-lg">
                    All Actions
                  </SelectItem>
                  {uniqueActions.map((act) => (
                    <SelectItem key={act} value={act} className="rounded-lg">
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ColumnConfigDropdown tableColumns={tableColumns} />
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
            <div>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="font-mono text-xs uppercase">
                      {tableColumns.orderedVisibleColumns.map((colId) => (
                        <TableHead
                          key={colId}
                          className={colId === "payload" ? "text-right" : undefined}
                        >
                          {AUDIT_LOG_COLUMN_LABELS[colId]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id} className="text-xs">
                        {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, log))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={handlePageSizeChange}
                onPageChange={(p) =>
                  setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
                }
                itemLabel="audit logs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Payload Inspection Modal */}
      <Dialog open={Boolean(inspectLog)} onOpenChange={(open) => !open && setInspectLog(null)}>
        <DialogContent className="border-border/80 rounded-2xl shadow-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm">
              <Code2 className="size-4 text-indigo-600 dark:text-indigo-400" />
              Audit Payload &bull; {inspectLog?.action}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Event ID: {inspectLog?.id} &bull; Request: {inspectLog?.requestId ?? "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-muted/40 max-h-80 overflow-x-auto rounded-xl border p-3 font-mono text-xs">
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
