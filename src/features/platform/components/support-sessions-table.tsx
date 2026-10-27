"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  LifeBuoy,
  Radio,
  ShieldAlert,
  StopCircle,
  Timer,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import {
  ControlledInput,
  ControlledSelect,
  ControlledTextarea,
  FormWrapper,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "@/components/ui/dialog";
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
import { useSearchQueryParams, useTableColumns, type TableColumnDef } from "@/lib/hooks";

import { PLATFORM_PERMISSION_KEYS } from "../permissions";
import { useEndSupportSession, useStartSupportSession, useSupportSessions } from "../queries";
import {
  startSupportSessionSchema,
  type PlatformSupportSession,
  type StartSupportSessionInput,
} from "../schemas";
import { PlatformPermissionGate } from "./platform-permission-gate";

function SessionCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s remaining`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = timeLeft === "Expired";

  return (
    <span
      className={`flex items-center gap-1 font-mono text-xs ${
        isExpired ? "text-destructive" : "font-semibold text-emerald-500"
      }`}
    >
      <Timer className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

type SupportSessionColumnId = "session" | "tenant" | "reason" | "status" | "started" | "actions";

const SUPPORT_SESSION_COLUMNS: TableColumnDef<SupportSessionColumnId>[] = [
  { id: "session", label: "Session ID / Operator", canHide: false, defaultVisible: true },
  { id: "tenant", label: "Customer Tenant ID", canHide: true, defaultVisible: true },
  { id: "reason", label: "Stated Justification", canHide: true, defaultVisible: true },
  { id: "status", label: "Status & Window", canHide: true, defaultVisible: true },
  { id: "started", label: "Started", canHide: true, defaultVisible: true },
  { id: "actions", label: "Action", canHide: false, defaultVisible: true },
];

const SUPPORT_SESSION_COLUMN_LABELS: Record<SupportSessionColumnId, string> = {
  session: "Session ID / Operator",
  tenant: "Customer Tenant ID",
  reason: "Stated Justification",
  status: "Status & Window",
  started: "Started",
  actions: "Action",
};

export function SupportSessionsTable() {
  const router = useRouter();
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [terminateSession, setTerminateSession] = useState<PlatformSupportSession | null>(null);
  const { getNumber, setParam, setParams } = useSearchQueryParams();
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

  const { data: sessionData, isLoading, error } = useSupportSessions();

  const sessions = useMemo(() => sessionData?.items ?? [], [sessionData?.items]);
  const activeSessions = useMemo(() => sessions.filter((s) => s?.status === "ACTIVE"), [sessions]);

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedSessions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sessions.slice(start, start + pageSize);
  }, [sessions, safePage, pageSize]);

  const tableColumns = useTableColumns<SupportSessionColumnId>({
    columns: SUPPORT_SESSION_COLUMNS,
    tableId: "platform_support_sessions_table",
  });

  function renderCell(colId: SupportSessionColumnId, session: PlatformSupportSession) {
    const isActive = session.status === "ACTIVE";
    switch (colId) {
      case "session":
        return (
          <TableCell key="session">
            <div className="flex flex-col">
              <code className="text-foreground font-mono text-[10px] font-bold">
                {session.id.slice(0, 8)}...
              </code>
              <span className="text-muted-foreground text-[11px]">
                {session.staffDisplayName ?? session.staffEmail ?? session.staffId.slice(0, 8)}
              </span>
            </div>
          </TableCell>
        );
      case "tenant":
        return (
          <TableCell key="tenant">
            <code className="text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 font-mono text-[11px]">
              {session.tenantId}
            </code>
          </TableCell>
        );
      case "reason":
        return (
          <TableCell key="reason" className="max-w-xs">
            <p className="text-foreground line-clamp-2 text-xs">{session.reason}</p>
          </TableCell>
        );
      case "status":
        return (
          <TableCell key="status">
            {isActive ? (
              <div className="space-y-1">
                <Badge variant="success" className="gap-1 font-mono text-[10px]">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                  ACTIVE
                </Badge>
                <SessionCountdown expiresAt={session.expiresAt} />
              </div>
            ) : session.status === "TERMINATED" ? (
              <Badge
                variant="outline"
                className="border-muted text-muted-foreground font-mono text-[10px]"
              >
                TERMINATED
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-destructive/30 text-destructive font-mono text-[10px]"
              >
                EXPIRED
              </Badge>
            )}
          </TableCell>
        );
      case "started":
        return (
          <TableCell key="started" className="text-muted-foreground font-mono text-[11px]">
            {new Date(session.startedAt).toLocaleString()}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key="actions" className="text-right">
            {isActive && (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await fetch("/api/platform/support-session/enter", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        sessionId: session.id,
                        tenantId: session.tenantId,
                      }),
                    });
                    router?.push?.("/dashboard");
                    router?.refresh?.();
                  }}
                  className="h-7 gap-1 border-emerald-500/30 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  Access Workspace
                </Button>
                <PlatformPermissionGate
                  permission={PLATFORM_PERMISSION_KEYS.SUPPORT_END}
                  hideInsteadOfBanner
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setTerminateSession(session)}
                    className="h-7 gap-1 text-xs"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Terminate
                  </Button>
                </PlatformPermissionGate>
              </div>
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
          <h1 className="text-2xl font-bold tracking-tight">Audited Support Delegation</h1>
          <p className="text-muted-foreground text-sm">
            Zero-standing customer privileges: time-bound, purpose-limited, cryptographic access
            tokens.
          </p>
        </div>
        <PlatformPermissionGate
          permission={PLATFORM_PERMISSION_KEYS.SUPPORT_START}
          hideInsteadOfBanner
        >
          <Button
            onClick={() => setInitiateDialogOpen(true)}
            className="gap-2 bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
          >
            <LifeBuoy className="h-4 w-4" />
            Initiate Support Delegation
          </Button>
        </PlatformPermissionGate>
      </div>

      {/* Security Architecture Principle Alert */}
      <div className="text-foreground flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-xs">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div className="space-y-1">
          <p className="text-foreground font-semibold">
            Immutable Tenant Isolation &amp; Controlled Access
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Platform operators possess <strong>no automatic or standing access</strong> to customer
            databases. Every cross-tenant operation requires an active record in{" "}
            <code>PlatformSupportSessions</code>. All queries during an active session are tied to
            the operator’s identity in the immutable audit trail.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-emerald-500 uppercase">
              Active Delegations
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-emerald-500">
              {activeSessions.length}
              <Radio className="h-5 w-5 animate-pulse text-emerald-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase">
              Total Sessions Executed
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold">
              {sessionData?.total ?? 0}
              <LifeBuoy className="text-muted-foreground/60 h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 border-border/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-amber-500 uppercase">
              Max Session Window
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-amber-500">
              120 min
              <Clock className="h-5 w-5 text-amber-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-sm font-semibold">Audit Records of Tenant Support</CardTitle>
            <CardDescription className="text-xs">
              Historical log of time-bound access tickets and operator justifications.
            </CardDescription>
          </div>
          <ColumnConfigDropdown tableColumns={tableColumns} />
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
              Failed to load support sessions: {getErrorMessage(error)}
            </div>
          ) : (sessionData?.items ?? []).length === 0 ? (
            <div className="text-muted-foreground p-12 text-center text-sm">
              No support sessions have been initiated yet.
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="font-mono text-xs uppercase">
                    {tableColumns.orderedVisibleColumns.map((colId) => (
                      <TableHead
                        key={colId}
                        className={colId === "actions" ? "text-right" : undefined}
                      >
                        {SUPPORT_SESSION_COLUMN_LABELS[colId]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSessions.map((session) => (
                    <TableRow key={session.id} className="text-xs">
                      {tableColumns.orderedVisibleColumns.map((colId) =>
                        renderCell(colId, session),
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={sessions.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={handlePageSizeChange}
                onPageChange={(p) =>
                  setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
                }
                itemLabel="sessions"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiate Session Dialog */}
      <InitiateSupportSessionDialog
        open={initiateDialogOpen}
        onOpenChange={setInitiateDialogOpen}
      />

      {/* Terminate Session Dialog */}
      <TerminateSessionDialog
        session={terminateSession}
        open={Boolean(terminateSession)}
        onOpenChange={(open) => !open && setTerminateSession(null)}
      />
    </div>
  );
}

function InitiateSupportSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const { mutateAsync: startSession, isPending } = useStartSupportSession();

  const methods = useForm<StartSupportSessionInput>({
    resolver: zodResolver(startSupportSessionSchema),
    defaultValues: {
      tenantId: "",
      targetUserId: "",
      reason: "",
      durationMinutes: 30,
    },
  });

  const durationOptions = [
    { label: "15 minutes (Quick Diagnosis)", value: "15" },
    { label: "30 minutes (Standard Support)", value: "30" },
    { label: "60 minutes (Deep Troubleshooting)", value: "60" },
    { label: "120 minutes (Emergency Incident)", value: "120" },
  ];

  const onSubmit = async (values: StartSupportSessionInput) => {
    setFormError(null);
    try {
      await startSession({
        tenantId: values.tenantId.trim(),
        targetUserId: values.targetUserId?.trim() || undefined,
        reason: values.reason.trim(),
        durationMinutes: Number(values.durationMinutes),
      });
      methods.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to initiate support session"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-emerald-500" />
            Initiate Customer Support Delegation
          </DialogTitle>
          <DialogDescription className="text-xs">
            This action grants temporary, audited customer tenant access to investigate tickets.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <ControlledInput
            name="tenantId"
            label="Customer Tenant ID (UUID)"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            required
            className="h-9 font-mono text-xs"
          />

          <ControlledInput
            name="targetUserId"
            label="Target User ID (Optional Impersonation)"
            placeholder="Leave empty for workspace-level support, or enter target user UUID"
            className="h-9 font-mono text-xs"
          />

          <ControlledTextarea
            name="reason"
            label="Justification / Support Ticket Ref"
            placeholder="Describe ticket reference (e.g. TICKET-9421: Investigating data export failure)"
            required
            className="h-20 resize-none text-xs"
          />

          <ControlledSelect
            name="durationMinutes"
            label="Access Duration Window"
            placeholder="Select duration"
            options={durationOptions}
            returnPrimitiveValue
            required
          />

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Session initiation is logged to the Platform Compliance Audit Trail with your staff
              identity and IP address.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingText="Authorizing..."
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Start Audited Session
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}

function TerminateSessionDialog({
  session,
  open,
  onOpenChange,
}: {
  session: PlatformSupportSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const { mutateAsync: endSession, isPending } = useEndSupportSession();

  const methods = useForm<{ outcome: string }>({
    defaultValues: {
      outcome: "",
    },
  });

  const onSubmit = async (values: { outcome: string }) => {
    if (!session) return;
    setFormError(null);
    try {
      await endSession({
        sessionId: session.id,
        outcome: values.outcome.trim() || undefined,
      });
      methods.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to terminate session"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <StopCircle className="h-5 w-5" />
            Terminate Active Support Delegation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Immediately revokes support session {session?.id.slice(0, 8)}... and blocks all
            cross-tenant access.
          </DialogDescription>
        </DialogHeader>

        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 py-2">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <ControlledInput
            name="outcome"
            label="Optional Outcome Resolution Notes"
            placeholder="e.g. Export job successfully restarted, ticket resolved"
            className="h-9 text-xs"
          />

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton
              pending={isPending}
              pendingText="Terminating..."
              size="sm"
              variant="destructive"
            >
              Terminate Immediately
            </SubmitButton>
          </DialogFooter>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
