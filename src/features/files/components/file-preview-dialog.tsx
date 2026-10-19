"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileCodeIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/errors";
import type { FileRecord } from "@/lib/api/types";
import { formatBytes, formatDate } from "@/lib/format";

import { getDownloadUrl } from "../api";
import { FileStatusBadge } from "./file-status-badge";

export interface FilePreviewDialogProps {
  file: FileRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function openInNewTab(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const filename = file?.filename ?? "";
  const contentType = file?.contentType ?? "";

  const isImage =
    contentType.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/i.test(filename);
  const isPdf = contentType === "application/pdf" || /\.pdf$/i.test(filename);
  const isText =
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    /\.(txt|md|json|csv|log|ts|tsx|js|jsx|html|css|yaml|yml|xml|sql|env)$/i.test(filename);
  const isVideo = contentType.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(filename);
  const isAudio = contentType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/i.test(filename);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
      setLoading(false);
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open || !file) return;

    let isCancelled = false;

    async function loadPreview() {
      if (!file) return;
      setLoading(true);
      setError(null);
      setTextContent(null);

      try {
        const { url } = await getDownloadUrl(file.id);
        if (isCancelled) return;
        setPreviewUrl(url);

        // If file is text or code, fetch text contents to render inline
        if (isText) {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load text preview");
            const text = await res.text();
            if (!isCancelled) {
              // Cap at 250,000 chars for smooth rendering
              setTextContent(
                text.length > 250000
                  ? text.slice(0, 250000) + "\n\n--- [Preview truncated due to file length] ---"
                  : text,
              );
            }
          } catch {
            // Text fetch failed (e.g. CORS on S3 presigned), fall back to URL preview/download
            if (!isCancelled) {
              setTextContent(null);
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(getErrorMessage(err, "Could not fetch preview link."));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isCancelled = true;
    };
  }, [open, file, isText]);

  const handleCopyText = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success("Text copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="size-5 text-indigo-500" />;
    if (isPdf) return <FileTextIcon className="size-5 text-rose-500" />;
    if (isText) return <FileCodeIcon className="size-5 text-amber-500" />;
    if (/\.(csv|xlsx?)$/i.test(filename))
      return <FileSpreadsheetIcon className="size-5 text-emerald-500" />;
    return <FileIcon className="size-5 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0 sm:max-w-4xl">
        {/* Header Bar */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                {getFileIcon()}
              </div>
              <div className="min-w-0">
                <DialogTitle
                  className="max-w-md truncate text-sm font-semibold sm:max-w-lg"
                  title={filename}
                >
                  {filename}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                  <span>{formatBytes(file?.size ?? 0)}</span>
                  <span>•</span>
                  <span>{file?.createdAt ? formatDate(file.createdAt) : ""}</span>
                  {file?.status ? (
                    <>
                      <span>•</span>
                      <FileStatusBadge status={file.status} />
                    </>
                  ) : null}
                  {contentType ? (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {contentType}
                    </Badge>
                  ) : null}
                </DialogDescription>
              </div>
            </div>

            {/* Header Action Buttons */}
            {previewUrl ? (
              <div className="flex items-center gap-1.5">
                {isText && textContent ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => void handleCopyText()}
                  >
                    {copied ? (
                      <CheckIcon className="size-3.5 text-emerald-600" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => openInNewTab(previewUrl)}
                  title="Open file in a new browser tab"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  <span className="hidden sm:inline">Open Tab</span>
                </Button>

                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => triggerDownload(previewUrl, filename)}
                >
                  <DownloadIcon className="size-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        {/* Preview Content Area */}
        <div className="bg-muted/20 relative flex max-h-[calc(92vh-100px)] min-h-[360px] items-center justify-center overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Spinner className="size-8" />
              <p className="text-muted-foreground text-xs font-medium">Loading file preview…</p>
            </div>
          ) : error ? (
            <div className="max-w-md py-8">
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-2">
                  <span>{error}</span>
                  {previewUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInNewTab(previewUrl)}
                      className="w-fit text-xs"
                    >
                      Try opening in new tab
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            </div>
          ) : previewUrl ? (
            <>
              {/* 1. Image Preview */}
              {isImage ? (
                <div className="flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={filename}
                    className="max-h-[68vh] w-auto max-w-full rounded object-contain shadow-sm"
                  />
                </div>
              ) : null}

              {/* 2. PDF Preview */}
              {isPdf ? (
                <div className="h-[68vh] w-full rounded-md border">
                  <iframe
                    src={`${previewUrl}#toolbar=1`}
                    title={filename}
                    className="h-full w-full rounded-md border-0"
                  />
                </div>
              ) : null}

              {/* 3. Text / Code Preview */}
              {isText && textContent !== null ? (
                <div className="bg-background max-h-[68vh] w-full overflow-auto rounded-md border p-4 font-mono text-xs leading-relaxed select-text">
                  <pre className="break-words whitespace-pre-wrap">
                    <code>{textContent}</code>
                  </pre>
                </div>
              ) : null}

              {/* 4. Video Preview */}
              {isVideo ? (
                <div className="flex max-h-[68vh] w-full items-center justify-center">
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-[65vh] w-auto max-w-full rounded-md shadow-md"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : null}

              {/* 5. Audio Preview */}
              {isAudio ? (
                <div className="bg-background flex flex-col items-center justify-center gap-4 rounded-lg border p-8 shadow-sm">
                  <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                    <FileIcon className="size-6" />
                  </div>
                  <p className="text-sm font-semibold">{filename}</p>
                  <audio src={previewUrl} controls className="w-full max-w-md">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : null}

              {/* 6. Unsupported / Binary Preview Fallback */}
              {!isImage && !isPdf && !(isText && textContent !== null) && !isVideo && !isAudio ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <div className="bg-muted flex size-16 items-center justify-center rounded-2xl">
                    {getFileIcon()}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold">{filename}</p>
                    <p className="text-muted-foreground text-xs">
                      Inline preview is not available for this file type ({contentType || "binary"}
                      ).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" onClick={() => triggerDownload(previewUrl, filename)}>
                      <DownloadIcon className="mr-1.5 size-3.5" />
                      Download to view
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openInNewTab(previewUrl)}>
                      <ExternalLinkIcon className="mr-1.5 size-3.5" />
                      Open in tab
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
