"use client";

import { useState } from "react";
import { HistoryIcon, RotateCcwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format";

import { useRollbackTemplateVersion, useTemplateVersions } from "../queries";
import type { EmailTemplate, EmailTemplateVersion } from "../types";

interface VersionHistoryDrawerProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDrawer({ template, open, onOpenChange }: VersionHistoryDrawerProps) {
  const { data: versions, isLoading } = useTemplateVersions(template?.id);
  const rollbackMutation = useRollbackTemplateVersion({
    onSuccess: () => onOpenChange(false),
  });

  const [previewVersion, setPreviewVersion] = useState<EmailTemplateVersion | null>(null);

  const handleRollback = (ver: EmailTemplateVersion) => {
    if (!template) return;
    if (
      confirm(
        `Are you sure you want to rollback to Version ${ver.version}? A new snapshot of the current template will be preserved.`,
      )
    ) {
      rollbackMutation.mutate({
        templateId: template.id,
        version: ver.version,
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col p-6 sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="text-primary size-5" />
              <SheetTitle>Version History</SheetTitle>
            </div>
            <SheetDescription>
              {template?.name} (Current: v{template?.currentVersion})
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="text-muted-foreground size-6" />
              </div>
            ) : !versions || versions.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center text-sm">
                No previous snapshots recorded yet. Versions are automatically created whenever the
                template is edited.
              </div>
            ) : (
              <div className="border-border relative ml-3 space-y-6 border-l">
                {versions.map((ver) => (
                  <div key={ver.id} className="relative pl-6">
                    <span className="border-background bg-primary absolute top-1.5 -left-2 size-4 rounded-full border-2" />
                    <div className="bg-card space-y-2 rounded-xl border p-4 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          v{ver.version}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(ver.createdAt)}
                        </span>
                      </div>

                      <div className="line-clamp-1 text-sm font-medium">{ver.subject}</div>

                      {ver.variables?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ver.variables.slice(0, 4).map((v) => (
                            <Badge
                              key={v}
                              variant="secondary"
                              className="px-1 py-0 font-mono text-[10px]"
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {ver.variables.length > 4 && (
                            <span className="text-muted-foreground text-[10px]">
                              +{ver.variables.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 border-t pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setPreviewVersion(ver)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-primary h-7 gap-1 px-2 text-xs"
                          disabled={rollbackMutation.isPending}
                          onClick={() => handleRollback(ver)}
                        >
                          <RotateCcwIcon className="size-3" />
                          <span>Rollback</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Snapshot Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={(o) => !o && setPreviewVersion(null)}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col p-6">
          <DialogHeader>
            <DialogTitle>Snapshot Preview: v{previewVersion?.version}</DialogTitle>
            <DialogDescription>Subject: {previewVersion?.subject}</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/20 flex-1 overflow-auto rounded-lg border p-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewVersion?.htmlContent || "" }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
