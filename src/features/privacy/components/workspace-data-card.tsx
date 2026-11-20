"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { useActiveTenant } from "@/features/tenants";
import { formatBytes, formatDateOnly, formatDateTime } from "@/lib/format";

import {
  useCancelTenantClosure,
  useRequestTenantClosure,
  useRequestTenantDataExport,
  useTenantClosureStatus,
  useTenantDataExports,
} from "../queries";

export function WorkspaceDataCard() {
  const { activeTenant } = useActiveTenant();
  const tenantId = activeTenant?.id ?? "";
  const tenantSlug = activeTenant?.slug ?? "";

  const { data: exportsList, isLoading: exportsLoading } = useTenantDataExports(tenantId);
  const { mutate: requestExport, isPending: exportPending } = useRequestTenantDataExport(tenantId);

  const { data: closureStatus, isLoading: closureLoading } = useTenantClosureStatus(tenantId);
  const { mutate: requestClosure, isPending: closurePending } = useRequestTenantClosure(tenantId);
  const { mutate: cancelClosure, isPending: cancelPending } = useCancelTenantClosure(tenantId);

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [slugConfirmation, setSlugConfirmation] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const handleRequestExport = () => {
    requestExport(undefined, {
      onSuccess: () => {
        toast.success("Workspace data export initiated. The file will be available shortly.");
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to initiate workspace data export.");
      },
    });
  };

  const handleConfirmClosure = () => {
    if (slugConfirmation.trim().toLowerCase() !== tenantSlug.toLowerCase()) {
      toast.error(`Please type the exact workspace slug "${tenantSlug}" to confirm.`);
      return;
    }

    requestClosure(
      {
        slugConfirmation: slugConfirmation.trim(),
        reason: closeReason || undefined,
      },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
          setSlugConfirmation("");
          setCloseReason("");
          toast.success("Workspace closed. A 30-day grace period is now active.");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to close workspace.");
        },
      },
    );
  };

  const handleCancelClosure = () => {
    cancelClosure(undefined, {
      onSuccess: () => {
        toast.success("Workspace closure canceled. Workspace restored to ACTIVE.");
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to cancel workspace closure.");
      },
    });
  };

  const isClosed = closureStatus?.isClosed ?? false;
  const isSlugConfirmed = slugConfirmation.trim().toLowerCase() === tenantSlug.toLowerCase();

  return (
    <div className="space-y-6">
      {/* 1. Full Workspace Data Export */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Workspace Data Export</CardTitle>
              <CardDescription className="text-xs">
                Export a complete archive of your workspace metadata, members roster, roles matrix,
                billing history, and files manifest.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestExport}
              disabled={exportPending || !tenantId}
            >
              {exportPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Workspace Data
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exportsLoading ? (
            <p className="text-muted-foreground text-xs">Loading workspace export history...</p>
          ) : !exportsList || exportsList.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No workspace data exports have been generated yet.
            </p>
          ) : (
            <div className="divide-border/40 border-border/60 divide-y rounded-md border">
              {exportsList.map((item) => {
                const isCompleted = item.status === "COMPLETED";
                const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
                const canDownload = isCompleted && !isExpired && item.downloadUrl;

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatDateTime(item.createdAt)}</span>
                        <Badge
                          variant={
                            item.status === "COMPLETED"
                              ? "default"
                              : item.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                        {isExpired && isCompleted && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Link Expired
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {item.fileSizeBytes
                          ? formatBytes(item.fileSizeBytes)
                          : "Processing manifest"}
                      </p>
                    </div>

                    {canDownload && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.downloadUrl!} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Download Archive
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Workspace Closure (Danger Zone) */}
      <Card className="border-destructive/30 shadow-xs">
        <CardHeader>
          <CardTitle className="text-destructive text-base font-semibold">
            Danger Zone &mdash; Close Workspace
          </CardTitle>
          <CardDescription className="text-xs">
            Initiate workspace closure. All members will lose write access, and a 30-day grace
            period will begin before permanent purging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isClosed ? (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                Workspace Scheduled for Purge (30-Day Grace Period Active)
              </AlertTitle>
              <AlertDescription className="mt-1 space-y-3 text-xs">
                <p>
                  This workspace was closed on{" "}
                  <strong>
                    {closureStatus?.closedAt ? formatDateOnly(closureStatus.closedAt) : "recently"}
                  </strong>{" "}
                  and is scheduled for permanent data purge on{" "}
                  <strong>
                    {closureStatus?.purgeScheduledAt
                      ? formatDateTime(closureStatus.purgeScheduledAt)
                      : "the end of the 30-day grace period"}
                  </strong>
                  . An Owner can cancel closure and restore the workspace at any time before then.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelClosure}
                  disabled={cancelPending}
                  className="border-destructive/40 hover:bg-destructive/10"
                >
                  {cancelPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="mr-2 h-4 w-4" />
                  )}
                  Cancel Closure &amp; Restore Workspace
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium">30-Day Grace Period Protection</p>
                <p className="text-muted-foreground text-xs">
                  Closing a workspace freezes write operations and schedules all tenant data, files,
                  and memberships for permanent purge after 30 days. The slug cannot be reused for
                  90 days.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCloseDialogOpen(true)}
                disabled={closureLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Close Workspace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Close Workspace &ldquo;{activeTenant?.name}&rdquo;
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action initiates workspace deactivation. Please review the lifecycle:
            </DialogDescription>
          </DialogHeader>

          <div className="text-muted-foreground space-y-3 text-xs">
            <ul className="list-disc space-y-1 pl-5">
              <li>A 30-day read-only grace period starts immediately.</li>
              <li>Active subscriptions will be suspended to stop future billing.</li>
              <li>
                After 30 days, all database records, files in S3, and API keys will be permanently
                purged.
              </li>
              <li>
                The slug &ldquo;{tenantSlug}&rdquo; is preserved for 90 days to prevent reuse.
              </li>
            </ul>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="slug-confirm" className="text-xs">
                Type the workspace slug <strong>{tenantSlug}</strong> to confirm:
              </Label>
              <Input
                id="slug-confirm"
                placeholder={tenantSlug}
                value={slugConfirmation}
                onChange={(e) => setSlugConfirmation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="close-reason" className="text-xs">
                Closure Reason (Optional)
              </Label>
              <Input
                id="close-reason"
                placeholder="Reason for closing this workspace"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCloseDialogOpen(false)}
              disabled={closurePending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmClosure}
              disabled={closurePending || !isSlugConfirmed}
            >
              {closurePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Workspace Closure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
