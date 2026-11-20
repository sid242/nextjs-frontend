"use client";

import { useState } from "react";
import { Download, FileText, Loader2, ShieldAlert, Trash2, Undo2 } from "lucide-react";
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
import { formatBytes, formatDateOnly, formatDateTime } from "@/lib/format";

import {
  useAccountDeletionStatus,
  useCancelAccountDeletion,
  useConsentStatus,
  useRequestAccountDeletion,
  useRequestUserDataExport,
  useUserDataExports,
} from "../queries";

export function DataPrivacyCard() {
  const { data: exportsList, isLoading: exportsLoading } = useUserDataExports();
  const { mutate: requestExport, isPending: exportPending } = useRequestUserDataExport();

  const { data: deletionStatus, isLoading: deletionLoading } = useAccountDeletionStatus();
  const { mutate: requestDeletion, isPending: deletionPending } = useRequestAccountDeletion();
  const { mutate: cancelDeletion, isPending: cancelPending } = useCancelAccountDeletion();

  const { data: consentData } = useConsentStatus();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const handleRequestExport = () => {
    requestExport(undefined, {
      onSuccess: () => {
        toast.success("Data export initiated. Your file will be ready shortly.");
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to initiate data export.");
      },
    });
  };

  const handleConfirmDeletion = () => {
    requestDeletion(
      {
        password: deletePassword || undefined,
        reason: deleteReason || undefined,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletePassword("");
          setDeleteReason("");
          toast.success("Account deletion request submitted. 14-day cooling period active.");
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to request account deletion.");
        },
      },
    );
  };

  const handleCancelDeletion = () => {
    cancelDeletion(undefined, {
      onSuccess: () => {
        toast.success("Account deletion canceled. Your account remains active.");
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to cancel account deletion.");
      },
    });
  };

  const isCoolingPeriodActive = deletionStatus?.status === "COOLING_PERIOD";

  return (
    <div className="space-y-6">
      {/* 1. Personal Data Export (DSAR) */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Data Export (DSAR)</CardTitle>
              <CardDescription className="text-xs">
                Download a machine-readable archive (JSON) of your personal profile, addresses,
                login history, and file metadata in compliance with GDPR and India DPDP.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestExport}
              disabled={exportPending}
            >
              {exportPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Request Data Export
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exportsLoading ? (
            <p className="text-muted-foreground text-xs">Loading past export requests...</p>
          ) : !exportsList || exportsList.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No data export requests submitted yet. You can request an export once every 24 hours.
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
                          : "Pending processing"}
                      </p>
                    </div>

                    {canDownload && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.downloadUrl!} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Download
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

      {/* 2. Consent & Legal Documents */}
      {consentData?.documents && consentData.documents.length > 0 && (
        <Card className="border-border/60 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Legal & Policy Consents</CardTitle>
            <CardDescription className="text-xs">
              Review mandatory terms and policies governing your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-border/40 border-border/60 divide-y rounded-md border">
              {consentData.documents.map((doc) => (
                <div key={doc.documentId} className="flex items-center justify-between p-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-muted-foreground">
                      Version {doc.version} &bull; Effective {formatDateOnly(doc.effectiveAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={doc.isAccepted ? "default" : "secondary"}>
                      {doc.isAccepted ? "Accepted" : "Action Required"}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        View Document
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Delete Account (Danger Zone) */}
      <Card className="border-destructive/30 shadow-xs">
        <CardHeader>
          <CardTitle className="text-destructive text-base font-semibold">
            Danger Zone &mdash; Delete Account
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently close and anonymize your personal account and remove your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCoolingPeriodActive ? (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                Account Deletion Scheduled (Cooling Period Active)
              </AlertTitle>
              <AlertDescription className="mt-1 space-y-3 text-xs">
                <p>
                  Your account is scheduled for permanent anonymization on{" "}
                  <strong>
                    {deletionStatus?.graceEndsAt
                      ? formatDateTime(deletionStatus.graceEndsAt)
                      : "the end of your 14-day cooling period"}
                  </strong>
                  . You can cancel this request at any time before that date to keep your account.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDeletion}
                  disabled={cancelPending}
                  className="border-destructive/40 hover:bg-destructive/10"
                >
                  {cancelPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="mr-2 h-4 w-4" />
                  )}
                  Cancel Deletion &amp; Keep Account
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium">14-Day Grace Period Protection</p>
                <p className="text-muted-foreground text-xs">
                  Submitting a deletion request enters a 14-day cooling period. Note: You must
                  transfer ownership of any workspaces where you are the sole Owner first.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deletionLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Request Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to request account deletion? Please review the consequences:
            </DialogDescription>
          </DialogHeader>

          <div className="text-muted-foreground space-y-3 text-xs">
            <ul className="list-disc space-y-1 pl-5">
              <li>A 14-day cooling period will begin immediately.</li>
              <li>You will be logged out of all active sessions across devices.</li>
              <li>
                After 14 days, your profile data, email, and credentials will be irreversibly
                anonymized.
              </li>
              <li>
                You cannot delete your account if you are the sole Owner of an active workspace.
              </li>
            </ul>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-xs">
                Confirm Password
              </Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter your current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-reason" className="text-xs">
                Reason for leaving (Optional)
              </Label>
              <Input
                id="delete-reason"
                placeholder="Help us improve our service"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletionPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeletion}
              disabled={deletionPending}
            >
              {deletionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Deletion Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
