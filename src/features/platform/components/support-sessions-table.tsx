"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, LifeBuoy, Radio, ShieldAlert, StopCircle, Timer } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errors";

import { useEndSupportSession, useStartSupportSession, useSupportSessions } from "../queries";
import type { PlatformSupportSession } from "../schemas";

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

export function SupportSessionsTable() {
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [terminateSession, setTerminateSession] = useState<PlatformSupportSession | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");

  // Initiate form state
  const [tenantId, setTenantId] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: sessionData, isLoading, error } = useSupportSessions();
  const { mutateAsync: startSession, isPending: isStarting } = useStartSupportSession();
  const { mutateAsync: endSession, isPending: isEnding } = useEndSupportSession();

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!tenantId || !reason) {
      setFormError("Tenant ID and a valid business reason are required");
      return;
    }

    try {
      await startSession({
        tenantId: tenantId.trim(),
        reason: reason.trim(),
        durationMinutes,
      });
      setInitiateDialogOpen(false);
      setTenantId("");
      setReason("");
      setDurationMinutes(30);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to initiate support session"));
    }
  };

  const handleTerminate = async () => {
    if (!terminateSession) return;
    try {
      await endSession({
        sessionId: terminateSession.id,
        outcome: outcomeNotes || undefined,
      });
      setTerminateSession(null);
      setOutcomeNotes("");
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to terminate session"));
    }
  };

  const activeSessions = (sessionData?.items ?? []).filter((s) => s?.status === "ACTIVE");

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
        <Button
          onClick={() => {
            setFormError(null);
            setInitiateDialogOpen(true);
          }}
          className="gap-2 bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <LifeBuoy className="h-4 w-4" />
          Initiate Support Delegation
        </Button>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Audit Records of Tenant Support</CardTitle>
          <CardDescription className="text-xs">
            Historical log of time-bound access tickets and operator justifications.
          </CardDescription>
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
            <Table>
              <TableHeader>
                <TableRow className="font-mono text-xs uppercase">
                  <TableHead>Session ID / Operator</TableHead>
                  <TableHead>Customer Tenant ID</TableHead>
                  <TableHead>Stated Justification</TableHead>
                  <TableHead>Status &amp; Window</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessionData?.items ?? []).map((session) => {
                  const isActive = session.status === "ACTIVE";
                  return (
                    <TableRow key={session.id} className="text-xs">
                      <TableCell>
                        <div className="flex flex-col">
                          <code className="text-foreground font-mono text-[10px] font-bold">
                            {session.id.slice(0, 8)}...
                          </code>
                          <span className="text-muted-foreground text-[11px]">
                            {session.staffDisplayName ??
                              session.staffEmail ??
                              session.staffId.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 font-mono text-[11px]">
                          {session.tenantId}
                        </code>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <p className="text-foreground line-clamp-2 text-xs">{session.reason}</p>
                      </TableCell>

                      <TableCell>
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

                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {new Date(session.startedAt).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right">
                        {isActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setTerminateSession(session)}
                            className="h-7 gap-1 text-xs"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                            Terminate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Initiate Session Dialog */}
      <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
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

          <form onSubmit={handleStartSession} className="space-y-4 py-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Customer Tenant ID (UUID)</Label>
              <Input
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Justification / Support Ticket Ref</Label>
              <Textarea
                placeholder="Describe ticket reference (e.g. TICKET-9421: Investigating data export failure)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-20 resize-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Access Duration Window</Label>
              <Select
                value={String(durationMinutes)}
                onValueChange={(val) => setDurationMinutes(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes (Quick Diagnosis)</SelectItem>
                  <SelectItem value="30">30 minutes (Standard Support)</SelectItem>
                  <SelectItem value="60">60 minutes (Deep Troubleshooting)</SelectItem>
                  <SelectItem value="120">120 minutes (Emergency Incident)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-500">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Session initiation is logged to the Platform Compliance Audit Trail with your staff
                identity and IP address.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInitiateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isStarting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isStarting ? "Authorizing..." : "Start Audited Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terminate Session Dialog */}
      <Dialog
        open={Boolean(terminateSession)}
        onOpenChange={(open) => !open && setTerminateSession(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <StopCircle className="h-5 w-5" />
              Terminate Active Support Delegation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Immediately revokes support session {terminateSession?.id.slice(0, 8)}... and blocks
              all cross-tenant access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Optional Outcome Resolution Notes</Label>
              <Input
                placeholder="e.g. Export job successfully restarted, ticket resolved"
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTerminateSession(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleTerminate} disabled={isEnding}>
              {isEnding ? "Terminating..." : "Terminate Immediately"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
