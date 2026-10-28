"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  DownloadIcon,
  EyeIcon,
  FileCodeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/errors";
import type { FileRecord } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/format";

import { getDownloadUrl } from "../api";
import { triggerFileDownload } from "../download";
import { useFiles } from "../queries";
import { FilePreviewDialog } from "./file-preview-dialog";
import { FileStatusBadge } from "./file-status-badge";

function getFileIcon(filename: string, contentType: string) {
  if (contentType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) {
    return <ImageIcon className="size-4 text-indigo-500" />;
  }
  if (contentType === "application/pdf" || /\.pdf$/i.test(filename)) {
    return <FileTextIcon className="size-4 text-rose-500" />;
  }
  if (contentType?.startsWith("text/") || /\.(txt|json|md|ts|js|sql)$/i.test(filename)) {
    return <FileCodeIcon className="size-4 text-amber-500" />;
  }
  if (/\.(csv|xlsx?)$/i.test(filename)) {
    return <FileSpreadsheetIcon className="size-4 text-emerald-500" />;
  }
  return <FileIcon className="size-4 text-blue-500" />;
}

export function RecentFilesCard() {
  const { data, isPending, isError } = useFiles();
  const fileList = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray((data as { data?: FileRecord[] }).data)) {
      return (data as { data: FileRecord[] }).data;
    }
    return [];
  }, [data]);
  const recentFiles = fileList.slice(0, 5);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const handleDownload = async (file: FileRecord) => {
    try {
      const { url } = await getDownloadUrl(file.id, "attachment");
      await triggerFileDownload(url, file.filename);
      toast.success(`Downloading ${file.filename}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to download file."));
    }
  };

  return (
    <>
      <Card className="border-border/80 col-span-full rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Files</CardTitle>
            <CardDescription className="text-xs">
              Latest documents and uploads in your workspace
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs">
            <Link href="/files">
              <span>View all files</span>
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {isPending ? (
            <div className="grid gap-2.5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-muted-foreground py-6 text-center text-xs">
              Unable to load recent files.
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
              <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                <FileIcon className="text-muted-foreground size-5" />
              </div>
              <div className="grid gap-0.5">
                <p className="text-xs font-medium">No files uploaded yet</p>
                <p className="text-muted-foreground text-[11px]">
                  Upload your documents and images to access them anytime.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="mt-1 h-7 rounded-lg text-xs">
                <Link href="/files">
                  <UploadIcon className="mr-1.5 size-3" />
                  Upload a file
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-border/80 border-border/80 divide-y overflow-hidden rounded-xl border">
              {recentFiles.map((file) => (
                <div
                  key={file?.id}
                  className="hover:bg-muted/40 flex items-center justify-between gap-3 p-3 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted/70 flex size-8 shrink-0 items-center justify-center rounded-md">
                      {getFileIcon(file?.filename ?? "", file?.contentType ?? "")}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="hover:text-primary max-w-xs truncate text-left text-xs font-medium transition-colors hover:underline sm:max-w-md md:max-w-lg"
                        title={file?.filename}
                      >
                        {file?.filename}
                      </button>
                      <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                        <span>{formatBytes(file?.size ?? 0)}</span>
                        <span>•</span>
                        <span>{file?.createdAt ? formatDate(file.createdAt) : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <FileStatusBadge status={file?.status} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => setPreviewFile(file)}
                      title="Preview file directly"
                      aria-label={`Preview ${file?.filename}`}
                    >
                      <EyeIcon className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={file?.status !== "UPLOADED"}
                      onClick={() => void handleDownload(file)}
                      title="Download file"
                      aria-label={`Download ${file?.filename}`}
                    >
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FilePreviewDialog
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </>
  );
}
