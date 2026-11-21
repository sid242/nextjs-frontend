"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Play, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useActiveTenant } from "@/features/tenants";
import { formatDateTime } from "@/lib/format";

import {
  useCreateReportDefinition,
  useReportDefinitions,
  useReportRuns,
  useTriggerReportRun,
} from "../queries";
import type { ReportFormat, ReportType } from "../types";

export function ReportsManager() {
  const { activeTenantId } = useActiveTenant();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<ReportType>("MEMBERS");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("CSV");

  const {
    data: definitions = [],
    isLoading: isDefLoading,
    refetch: refetchDefs,
  } = useReportDefinitions(activeTenantId);

  const {
    data: runs = [],
    isLoading: isRunsLoading,
    refetch: refetchRuns,
  } = useReportRuns(activeTenantId);

  const createDefMutation = useCreateReportDefinition(activeTenantId);
  const triggerRunMutation = useTriggerReportRun(activeTenantId);

  const handleCreateDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;

    try {
      await createDefMutation.mutateAsync({
        name: reportName.trim(),
        type: reportType,
        format: reportFormat,
      });
      setReportName("");
      setIsCreateOpen(false);
    } catch {
      // error handled by react query
    }
  };

  const handleRunReport = async (definitionId: string) => {
    try {
      await triggerRunMutation.mutateAsync(definitionId);
    } catch {
      // error handled by react query
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Definitions Section */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileSpreadsheet className="text-primary size-4" /> Report Definitions
            </CardTitle>
            <CardDescription className="text-xs">
              Configured report schemas for automated workspace data extraction and auditing.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDefs()}
              className="h-8 text-xs"
            >
              <RefreshCw className="mr-1 size-3.5" /> Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="mr-1 size-3.5" /> New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateDefinition}>
                  <DialogHeader>
                    <DialogTitle className="text-base">Create Report Definition</DialogTitle>
                    <DialogDescription className="text-xs">
                      Define a dataset and format for recurring or on-demand export.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="report-name" className="text-xs">
                        Report Name
                      </Label>
                      <Input
                        id="report-name"
                        placeholder="e.g. Monthly Member Roster"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="report-type" className="text-xs">
                        Data Source / Module
                      </Label>
                      <Select
                        value={reportType}
                        onValueChange={(val) => setReportType(val as ReportType)}
                      >
                        <SelectTrigger id="report-type" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBERS" className="text-xs">
                            Workspace Members
                          </SelectItem>
                          <SelectItem value="AUDIT" className="text-xs">
                            Audit Logs & Security
                          </SelectItem>
                          <SelectItem value="USAGE" className="text-xs">
                            Usage Rollup & Meters
                          </SelectItem>
                          <SelectItem value="FILES" className="text-xs">
                            Cloud File Registry
                          </SelectItem>
                          <SelectItem value="BILLING" className="text-xs">
                            Invoices & Charges
                          </SelectItem>
                          <SelectItem value="SECURITY" className="text-xs">
                            Security Posture
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="report-format" className="text-xs">
                        Export Format
                      </Label>
                      <Select
                        value={reportFormat}
                        onValueChange={(val) => setReportFormat(val as ReportFormat)}
                      >
                        <SelectTrigger id="report-format" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CSV" className="text-xs">
                            CSV (Spreadsheet)
                          </SelectItem>
                          <SelectItem value="JSON" className="text-xs">
                            JSON (Structured Data)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createDefMutation.isPending || !reportName.trim()}
                      className="text-xs"
                    >
                      {createDefMutation.isPending && (
                        <Loader2 className="mr-1.5 size-3 animate-spin" />
                      )}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isDefLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : definitions?.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              No report definitions configured. Click &quot;New Report&quot; to configure your first
              export.
            </p>
          ) : (
            <div className="border-border/60 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Format</TableHead>
                    <TableHead className="text-xs font-semibold">Created</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definitions?.map((def) => (
                    <TableRow key={def.id}>
                      <TableCell className="text-foreground text-xs font-medium">
                        {def.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {def.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {def.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateTime(def.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={triggerRunMutation.isPending}
                          onClick={() => handleRunReport(def.id)}
                          className="h-7 px-2.5 text-xs"
                        >
                          {triggerRunMutation.isPending ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <Play className="text-primary fill-primary mr-1 size-3" />
                          )}
                          Run Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Execution History Section */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Executions & Downloads</CardTitle>
            <CardDescription className="text-xs">
              Generated snapshots ready for direct download.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetchRuns()} className="h-8 text-xs">
            <RefreshCw className="mr-1 size-3.5" /> Refresh Runs
          </Button>
        </CardHeader>
        <CardContent>
          {isRunsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : runs?.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              No report runs executed yet. Click &quot;Run Now&quot; on any definition above to
              generate an export.
            </p>
          ) : (
            <div className="border-border/60 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Rows Exported</TableHead>
                    <TableHead className="text-xs font-semibold">Completed At</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs?.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === "COMPLETED"
                              ? "default"
                              : run.status === "FAILED"
                                ? "destructive"
                                : "outline"
                          }
                          className="font-mono text-[10px]"
                        >
                          {run.status}
                        </Badge>
                        {run.error && (
                          <span className="text-destructive mt-0.5 block max-w-[200px] truncate text-[11px]">
                            {run.error}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {run.rowCount} row{run.rowCount === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {run.finishedAt ? formatDateTime(run.finishedAt) : "In progress..."}
                      </TableCell>
                      <TableCell className="text-right">
                        {run.downloadUrl ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                          >
                            <a
                              href={run.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-primary inline-flex items-center gap-1"
                            >
                              <Download className="mr-1 size-3" /> Download
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            {run.status === "COMPLETED" ? "Expired" : "Pending"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
