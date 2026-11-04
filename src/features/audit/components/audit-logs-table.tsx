"use client";

import * as React from "react";
import {
  DownloadIcon,
  FileCodeIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldXIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { exportTenantAuditLogs } from "../api";
import { useTenantAuditLogs } from "../queries";
import type { AuditLog, AuditLogsFilter } from "../types";

interface AuditLogsTableProps {
  tenantId: string;
  isExportAllowed?: boolean;
}

interface FilterFormState {
  page: number;
  limit: number;
  search: string;
  result: string;
  source: string;
}

export function AuditLogsTable({ tenantId, isExportAllowed = true }: AuditLogsTableProps) {
  const [filters, setFilters] = React.useState<FilterFormState>({
    page: 1,
    limit: 20,
    search: "",
    result: "ALL",
    source: "ALL",
  });

  const [activeLogForDetails, setActiveLogForDetails] = React.useState<AuditLog | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const queryFilters: AuditLogsFilter = React.useMemo(() => {
    return {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      result: filters.result !== "ALL" ? filters.result : undefined,
      source: filters.source !== "ALL" ? filters.source : undefined,
    };
  }, [filters]);

  const { data, isLoading, isFetching, refetch } = useTenantAuditLogs(tenantId, queryFilters);

  const handleExportCsv = async () => {
    if (!isExportAllowed) {
      toast.error(
        "Audit log export is not available on your current plan. Please upgrade to Pro or Enterprise.",
      );
      return;
    }

    try {
      setIsExporting(true);
      const blob = await exportTenantAuditLogs(tenantId, queryFilters, "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${tenantId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported to CSV successfully");
    } catch {
      toast.error("Failed to export audit logs. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result?.toUpperCase?.()) {
      case "SUCCESS":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <ShieldCheckIcon className="mr-1 h-3 w-3 text-emerald-600" />
            SUCCESS
          </Badge>
        );
      case "DENIED":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <ShieldAlertIcon className="mr-1 h-3 w-3 text-amber-600" />
            DENIED
          </Badge>
        );
      case "FAILURE":
      default:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <ShieldXIcon className="mr-1 h-3 w-3 text-rose-600" />
            {result || "FAILURE"}
          </Badge>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source?.toUpperCase?.()) {
      case "DIRECT":
        return <Badge variant="secondary">Direct</Badge>;
      case "GROUP":
        return (
          <Badge variant="default" className="bg-sky-600">
            Group
          </Badge>
        );
      case "IMPERSONATION":
        return <Badge variant="destructive">Impersonated</Badge>;
      case "SYSTEM":
        return <Badge variant="outline">System</Badge>;
      case "JOB":
        return <Badge variant="outline">Background Job</Badge>;
      default:
        return <Badge variant="secondary">{source}</Badge>;
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Security & Audit Trail</CardTitle>
          <CardDescription>
            Append-only compliance log of security actions, user access, and configuration changes.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button variant="default" size="sm" onClick={handleExportCsv} disabled={isExporting}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search action, IP, resource ID, or reason..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-9"
            />
          </div>

          <div>
            <Select
              value={filters.result}
              onValueChange={(val) => setFilters((prev) => ({ ...prev, result: val, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Result: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Results</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
                <SelectItem value="FAILURE">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.source}
              onValueChange={(val) => setFilters((prev) => ({ ...prev, source: val, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Source: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                <SelectItem value="DIRECT">Direct Action</SelectItem>
                <SelectItem value="GROUP">User Group</SelectItem>
                <SelectItem value="IMPERSONATION">Impersonation</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="JOB">Job / Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <div className="border-border rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target / Resource</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading audit trail...
                  </TableCell>
                </TableRow>
              ) : (data?.items?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                    No audit records found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold">{log.action}</span>
                    </TableCell>
                    <TableCell>{getResultBadge(log.result)}</TableCell>
                    <TableCell>{getSourceBadge(log.source)}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">{log.actorName || "System / API"}</div>
                        <div className="text-muted-foreground">
                          {log.actorEmail || log.actorUserId || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">
                          {log.resourceType || log.entityType || "—"}
                        </div>
                        <div className="text-muted-foreground max-w-[140px] truncate font-mono">
                          {log.resourceId || log.entityId || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setActiveLogForDetails(log)}>
                        <FileCodeIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination bar */}
        {(data?.total ?? 0) > filters.limit && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground text-xs">
              Showing {(filters.page - 1) * filters.limit + 1} -{" "}
              {Math.min(filters.page * filters.limit, data?.total ?? 0)} of {data?.total ?? 0}{" "}
              events
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page * filters.limit >= (data?.total ?? 0)}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog
        open={Boolean(activeLogForDetails)}
        onOpenChange={(open) => !open && setActiveLogForDetails(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Event Details</DialogTitle>
            <DialogDescription>
              Inspection of security event #{activeLogForDetails?.id}
            </DialogDescription>
          </DialogHeader>

          {activeLogForDetails && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-muted/40 grid grid-cols-2 gap-3 rounded-lg border p-3 font-mono">
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  {activeLogForDetails.action}
                </div>
                <div>
                  <span className="text-muted-foreground">Result:</span>{" "}
                  {activeLogForDetails.result}
                </div>
                <div>
                  <span className="text-muted-foreground">Source:</span>{" "}
                  {activeLogForDetails.source}
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>{" "}
                  {activeLogForDetails.ipAddress || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Request ID:</span>{" "}
                  {activeLogForDetails.requestId || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Correlation ID:</span>{" "}
                  {activeLogForDetails.correlationId || "—"}
                </div>
              </div>

              {activeLogForDetails.reason && (
                <div>
                  <div className="text-muted-foreground mb-1 font-semibold">
                    Reason / Explanation:
                  </div>
                  <div className="bg-muted/20 rounded-md border p-2">
                    {activeLogForDetails.reason}
                  </div>
                </div>
              )}

              {activeLogForDetails.metadataBefore && (
                <div>
                  <div className="text-muted-foreground mb-1 font-semibold">
                    Before State (Redacted):
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                    {JSON.stringify(activeLogForDetails.metadataBefore, null, 2)}
                  </pre>
                </div>
              )}

              {activeLogForDetails.metadataAfter && (
                <div>
                  <div className="text-muted-foreground mb-1 font-semibold">
                    After State (Redacted):
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                    {JSON.stringify(activeLogForDetails.metadataAfter, null, 2)}
                  </pre>
                </div>
              )}

              {activeLogForDetails.metadata &&
                !activeLogForDetails.metadataBefore &&
                !activeLogForDetails.metadataAfter && (
                  <div>
                    <div className="text-muted-foreground mb-1 font-semibold">
                      Metadata (Redacted):
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
                      {JSON.stringify(activeLogForDetails.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
