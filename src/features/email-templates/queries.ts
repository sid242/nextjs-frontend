"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createEmailTemplate,
  createSuppression,
  deleteEmailTemplate,
  deleteSuppression,
  getEmailTemplate,
  listDeliveryLogs,
  listEmailTemplates,
  listSuppressions,
  listTemplateVersions,
  rollbackTemplateVersion,
  testSendEmailTemplate,
  updateEmailTemplate,
} from "./api";
import { emailTemplatesKeys } from "./keys";
import type {
  CreateEmailTemplateInput,
  CreateSuppressionInput,
  ListDeliveryLogsParams,
  ListEmailTemplatesParams,
  ListSuppressionsParams,
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

// Template Versions & Rollback
export function useTemplateVersions(templateId?: string) {
  return useQuery({
    queryKey: emailTemplatesKeys.versions(templateId || ""),
    queryFn: ({ signal }) => listTemplateVersions(templateId!, signal),
    enabled: Boolean(templateId),
  });
}

export function useRollbackTemplateVersion(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, version }: { templateId: string; version: number }) =>
      rollbackTemplateVersion(templateId, version),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });
      toast.success(`Template rolled back to version ${vars.version}`);
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to rollback template";
      toast.error(msg);
    },
  });
}

// Delivery Logs
export function useEmailDeliveryLogs(params?: ListDeliveryLogsParams) {
  return useQuery({
    queryKey: emailTemplatesKeys.deliveryLogs(params as Record<string, unknown>),
    queryFn: ({ signal }) => listDeliveryLogs(params, signal),
  });
}

// Suppressions
export function useEmailSuppressions(params?: ListSuppressionsParams) {
  return useQuery({
    queryKey: emailTemplatesKeys.suppressions(params as Record<string, unknown>),
    queryFn: ({ signal }) => listSuppressions(params, signal),
  });
}

export function useCreateSuppression(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSuppressionInput) => createSuppression(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.suppressions() });
      toast.success("Recipient added to suppression list");
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to suppress email";
      toast.error(msg);
    },
  });
}

export function useDeleteSuppression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSuppression(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.suppressions() });
      toast.success("Recipient removed from suppression list");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to remove suppression";
      toast.error(msg);
    },
  });
}
