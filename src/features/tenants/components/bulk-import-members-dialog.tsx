"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { ImportMemberRow, ValidateImportResult } from "../import-export.types";
import { useExecuteMemberImport, useValidateMemberImport } from "../queries";

interface BulkImportMembersDialogProps {
  tenantId?: string | null;
  onSuccess?: () => void;
}

const SAMPLE_CSV = `email,role,firstName,lastName,jobTitle,department,phone
alex.chen@example.com,ADMIN,Alex,Chen,Engineering Manager,Engineering,+1555123456
sarah.miller@example.com,MEMBER,Sarah,Miller,Senior Designer,Product Design,+1555234567
david.kumar@example.com,MEMBER,David,Kumar,Backend Engineer,Engineering,+1555345678`;

export function BulkImportMembersDialog({ tenantId, onSuccess }: BulkImportMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [validationResult, setValidationResult] = useState<ValidateImportResult | null>(null);

  const validateMutation = useValidateMemberImport(tenantId);
  const executeMutation = useExecuteMemberImport(tenantId);

  const parseCsv = (text: string): ImportMemberRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const firstLine = lines[0];
    if (!firstLine || lines.length < 2) return [];

    const headers = firstLine.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    const firstIdx = headers.indexOf("firstname");
    const lastIdx = headers.indexOf("lastname");
    const titleIdx = headers.indexOf("jobtitle");
    const deptIdx = headers.indexOf("department");
    const phoneIdx = headers.indexOf("phone");
    const managerIdx = headers.indexOf("manageremail");

    if (emailIdx === -1) return [];

    const rows: ImportMemberRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const email = parts[emailIdx];
      if (!email) continue;

      rows.push({
        email,
        role: roleIdx !== -1 && parts[roleIdx] ? parts[roleIdx] : "MEMBER",
        firstName: firstIdx !== -1 ? parts[firstIdx] : undefined,
        lastName: lastIdx !== -1 ? parts[lastIdx] : undefined,
        jobTitle: titleIdx !== -1 ? parts[titleIdx] : undefined,
        department: deptIdx !== -1 ? parts[deptIdx] : undefined,
        phone: phoneIdx !== -1 ? parts[phoneIdx] : undefined,
        managerEmail: managerIdx !== -1 ? parts[managerIdx] : undefined,
      });
    }

    return rows;
  };

  const handleValidate = async () => {
    const parsed = parseCsv(csvContent);
    if (parsed.length === 0) {
      toast.error("Invalid CSV format. Header row must include 'email'.");
      return;
    }

    try {
      const result = await validateMutation.mutateAsync(parsed);
      setValidationResult(result);
      if (result.exceedsQuota) {
        toast.warning(
          `Import exceeds remaining seat quota (${result.quotaAvailable} seat${
            result.quotaAvailable === 1 ? "" : "s"
          } available).`,
        );
      } else if (result.errorCount > 0) {
        toast.warning(`Validated with ${result.errorCount} duplicate or invalid row(s).`);
      } else {
        toast.success(`Validated ${result.validCount} valid member(s) ready for import.`);
      }
    } catch {
      toast.error("Failed to validate CSV rows. Please check format.");
    }
  };

  const handleImport = async () => {
    if (!validationResult) return;
    const validRows = validationResult.rows
      .filter((r) => r.status === "VALID")
      .map((r) => ({
        email: r.email,
        role: r.role,
        firstName: r.firstName,
        lastName: r.lastName,
        jobTitle: r.jobTitle,
        department: r.department,
        phone: r.phone,
        managerEmail: r.managerEmail,
      }));

    if (validRows.length === 0) {
      toast.error("No valid member rows to import.");
      return;
    }

    try {
      const result = await executeMutation.mutateAsync({
        rows: validRows,
        sendInviteEmails: true,
      });

      toast.success(`Successfully imported ${result.importedCount} member(s).`);
      setOpen(false);
      setCsvContent("");
      setValidationResult(null);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(msg);
    }
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace-members-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 shadow-2xs">
          <FileUp className="size-4" /> Bulk Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="text-primary size-4" /> Bulk Import Workspace Members
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload or paste a CSV roster to validate seat quotas and batch invite team members.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-2 pr-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor="csv-file-input"
                className="hover:bg-muted/50 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-500" />
                Select CSV File
              </label>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={downloadSampleCsv}
              className="text-muted-foreground hover:text-foreground h-7 text-xs"
            >
              <Download className="mr-1 size-3" /> Download Sample CSV
            </Button>
          </div>

          <div className="space-y-1.5">
            <Textarea
              placeholder={SAMPLE_CSV}
              rows={5}
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setValidationResult(null);
              }}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={validateMutation.isPending || !csvContent.trim()}
              onClick={handleValidate}
              className="text-xs"
            >
              {validateMutation.isPending ? (
                <Loader2 className="mr-1.5 size-3 animate-spin" />
              ) : null}
              Validate & Preview
            </Button>

            {validationResult && (
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant={validationResult.exceedsQuota ? "destructive" : "secondary"}
                  className="font-mono text-[11px]"
                >
                  Seats Available: {validationResult.quotaAvailable}
                </Badge>
                <span className="text-muted-foreground">
                  {validationResult.validCount} valid / {validationResult.totalRows} total
                </span>
              </div>
            )}
          </div>

          {validationResult && (
            <div className="border-border/60 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-right text-xs">Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.rows.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {row.row}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{row.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {row.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.department || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "VALID" ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                          >
                            <CheckCircle2 className="mr-1 size-3" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="mr-1 size-3" /> {row.error || "Duplicate"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={
              executeMutation.isPending ||
              !validationResult ||
              validationResult.validCount === 0 ||
              validationResult.exceedsQuota
            }
            onClick={handleImport}
            className="text-xs"
          >
            {executeMutation.isPending && <Loader2 className="mr-1.5 size-3 animate-spin" />}
            Import Valid Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
