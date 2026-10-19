"use client";

import { useState } from "react";
import {
  DownloadIcon,
  RefreshCwIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveTenant, useTenantAuditLogsSearch, type AuditLogEntry } from "@/features/tenants";
import { formatDate } from "@/lib/format";

export default function AuditLogsPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: logs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useTenantAuditLogsSearch(activeTenantId, {
    search: search.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : (statusFilter as "SUCCESS" | "WARNING" | "FAILED"),
    page,
  });

  const filteredLogs = logs;

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export.");
      return;
    }
    const headers = ["Timestamp", "Action", "Actor", "IP", "Resource", "Status"];
    const rows = filteredLogs.map((log: AuditLogEntry) => [
      log.createdAt,
      `"${log.action}"`,
      `"${log.actor ?? "System"}"`,
      log.ip ?? "Unknown",
      `"${log.resource ?? ""}"`,
      log.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: (string | null | undefined)[]) => r.join(","))].join(
        "\n",
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${activeTenant?.slug ?? "export"}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log export downloaded.");
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Audit Trail & Security Logs"
          description={`Tamper-evident record of administrative and access events for ${activeTenant?.name ?? "your organization"}.`}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
            <DownloadIcon className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ScrollTextIcon className="text-primary size-4" /> Activity Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Every sensitive action is tracked with actor ID, source IP address, and timestamp.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search events, IPs…"
                value={search}
                onChange={(e) => setSearch(e?.target?.value ?? "")}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-muted-foreground animate-pulse text-sm">
                Loading audit events…
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheckIcon className="text-muted-foreground/50 mx-auto size-8" />
              <p className="text-muted-foreground mt-2 text-sm font-medium">
                No audit events match
              </p>
              <p className="text-muted-foreground/70 text-xs">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-border/50 divide-y">
              {filteredLogs.map((event: AuditLogEntry) => (
                <div
                  key={event.id}
                  className="hover:bg-accent/30 flex flex-col gap-2 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="grid gap-1 leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-mono text-xs font-semibold">
                        {event.action}
                      </span>
                      <Badge
                        variant={
                          event.status === "SUCCESS"
                            ? "outline"
                            : event.status === "WARNING"
                              ? "secondary"
                              : "default"
                        }
                        className="text-[10px] uppercase"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Actor:{" "}
                      <span className="text-foreground/80 font-medium">
                        {event.actor ?? "System"}
                      </span>{" "}
                      • IP: <span className="font-mono text-[11px]">{event.ip ?? "Unknown"}</span>
                      {event.resource && (
                        <span>
                          {" "}
                          • Resource: <span className="text-foreground/80">{event.resource}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <span className="text-muted-foreground/70 shrink-0 font-mono text-xs">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
