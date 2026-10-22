"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  listEmailTemplates,
  testSendEmailTemplate,
  updateEmailTemplate,
} from "./api";
import { emailTemplatesKeys } from "./keys";
import type {
  CreateEmailTemplateInput,
  ListEmailTemplatesParams,
  TestSendEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "./types";

export function useEmailTemplates(params?: ListEmailTemplatesParams) {
  return useQuery({
    queryKey: emailTemplatesKeys.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => listEmailTemplates(params, signal),
  });
}

export function useEmailTemplate(id?: string) {
  return useQuery({
    queryKey: emailTemplatesKeys.detail(id || ""),
    queryFn: ({ signal }) => getEmailTemplate(id!, signal),
    enabled: Boolean(id),
  });
}

export function useCreateEmailTemplate(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmailTemplateInput) => createEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });
      toast.success("Email template created successfully");
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create email template";
      toast.error(msg);
    },
  });
}

export function useUpdateEmailTemplate(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplateInput }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });
      toast.success("Email template updated successfully");
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update email template";
      toast.error(msg);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });
      toast.success("Email template deleted successfully");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete email template";
      toast.error(msg);
    },
  });
}

export function useTestSendEmailTemplate() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TestSendEmailTemplateInput }) =>
      testSendEmailTemplate(id, data),
    onSuccess: (res) => {
      toast.success(res?.message || "Test email dispatched successfully");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to send test email";
      toast.error(msg);
    },
  });
}
