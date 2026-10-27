"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FILE_INPUT_ACCEPT, MAX_UPLOAD_MB } from "../constants";
import { useUploadFiles } from "../use-upload-files";
import { UploadList } from "./upload-list";

export function FileUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const uploadFiles = useUploadFiles();

  function handle(files: FileList | null) {
    if (files && files.length > 0) void uploadFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
  }

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handle(event.dataTransfer.files);
        }}
        className={cn(
          "grid gap-3 rounded-lg border border-dashed p-6 transition-colors",
          dragging && "border-primary bg-accent",
        )}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <p className="font-medium">Upload files</p>
            <p className="text-muted-foreground text-sm">
              Drag and drop, or choose files. JPG, PNG, WebP or PDF, up to {MAX_UPLOAD_MB} MB each.
            </p>
          </div>
          <Button onClick={() => inputRef.current?.click()}>
            <UploadIcon /> Choose files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={FILE_INPUT_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => handle(event.target.files)}
          />
        </div>
      </div>
      <UploadList />
    </div>
  );
}
