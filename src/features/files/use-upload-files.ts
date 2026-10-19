"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage, isCanceledError } from "@/lib/api/errors";
import { runWithConcurrency } from "@/lib/async";
import { createId } from "@/lib/id";

import { confirmUpload, requestUpload } from "./api";
import { MAX_FILES_PER_BATCH, UPLOAD_CONCURRENCY } from "./constants";
import { filesKeys } from "./keys";
import { uploadToS3 } from "./upload";
import { uploadControllers, useUploadStore } from "./upload-store";
import { validateFile } from "./validation";

/** Cancel a running upload, or drop a queued one before it starts. */
export function cancelUpload(id: string): void {
  const controller = uploadControllers.get(id);
  if (controller) controller.abort();
  else useUploadStore.getState().patch(id, { status: "cancelled" });
}

/** 3 steps: ask the API for a presigned POST -> send to S3 with progress -> confirm so the backend processes it. */
async function uploadOne(id: string, file: File, onUploaded: () => void): Promise<void> {
  const { patch, items } = useUploadStore.getState();
  const current = items.find((item) => item.id === id);
  if (!current || current.status === "cancelled") return; // cancelled while waiting in the queue, or store was reset

  const controller = new AbortController();
  uploadControllers.set(id, controller);
  const { signal } = controller;

  try {
    patch(id, { status: "uploading" });
    const { fileId, upload } = await requestUpload(
      { filename: file.name, contentType: file.type },
      signal,
    );

    let lastPercent = -1;
    await uploadToS3(
      upload,
      file,
      (percent) => {
        if (percent === lastPercent) return;
        lastPercent = percent;
        patch(id, { progress: percent });
      },
      signal,
    );

    patch(id, { status: "confirming", progress: 100 });
    await confirmUpload(fileId, signal);
    patch(id, { status: "done" });
    onUploaded();
  } catch (err) {
    if (isCanceledError(err) || signal.aborted) patch(id, { status: "cancelled" });
    else
      patch(id, {
        status: "error",
        error: getErrorMessage(err, "Upload failed. Please try again."),
      });
  } finally {
    uploadControllers.delete(id);
  }
}

/** Queue files for upload (validated, at most UPLOAD_CONCURRENCY at a time). Progress lives in the upload store. */
export function useUploadFiles() {
  const queryClient = useQueryClient();

  return React.useCallback(
    async (files: File[]) => {
      const batch = files.slice(0, MAX_FILES_PER_BATCH);
      if (files.length > batch.length)
        toast.warning(`Only the first ${MAX_FILES_PER_BATCH} files were added.`);

      const accepted: { id: string; file: File }[] = [];
      for (const file of batch) {
        const problem = validateFile(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        const id = createId();
        useUploadStore
          .getState()
          .add({ id, name: file.name, size: file.size, progress: 0, status: "queued" });
        accepted.push({ id, file });
      }
      if (accepted.length === 0) return;

      const refreshList = () => void queryClient.invalidateQueries({ queryKey: filesKeys.all });
      await runWithConcurrency(accepted, UPLOAD_CONCURRENCY, ({ id, file }) =>
        uploadOne(id, file, refreshList),
      );

      const done = accepted.filter(
        ({ id }) =>
          useUploadStore.getState().items.find((item) => item.id === id)?.status === "done",
      ).length;
      if (done > 0) toast.success(done === 1 ? "File uploaded" : `${done} files uploaded`);
    },
    [queryClient],
  );
}
