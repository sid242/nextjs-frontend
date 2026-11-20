import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type {
  CreateEmailTemplateInput,
  CreateSuppressionInput,
  DeliveryLogsResponse,
  EmailTemplate,
  EmailTemplateListResponse,
  EmailTemplateVersion,
  ListDeliveryLogsParams,
  ListEmailTemplatesParams,
  ListSuppressionsParams,
  SuppressionsResponse,
  TestSendEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "./types";

export const listEmailTemplates = (params?: ListEmailTemplatesParams, signal?: AbortSignal) => {
  const qs = buildQueryString(params);
  return api.get<EmailTemplateListResponse>(`/email-templates${qs}`, { signal });
};

export const getEmailTemplate = (id: string, signal?: AbortSignal) =>
  api.get<EmailTemplate>(`/email-templates/${id}`, { signal });

export const createEmailTemplate = (data: CreateEmailTemplateInput) =>
  api.post<EmailTemplate>("/email-templates", data);

export const updateEmailTemplate = (id: string, data: UpdateEmailTemplateInput) =>
  api.put<EmailTemplate>(`/email-templates/${id}`, data);

export const deleteEmailTemplate = (id: string) =>
  api.delete<{ message: string }>(`/email-templates/${id}`);

export const testSendEmailTemplate = (id: string, data: TestSendEmailTemplateInput) =>
  api.post<{ success: boolean; message: string; renderedSubject: string }>(
    `/email-templates/${id}/test-send`,
    data,
  );

// Versions
export const listTemplateVersions = (templateId: string, signal?: AbortSignal) =>
  api.get<EmailTemplateVersion[]>(`/email-templates/${templateId}/versions`, { signal });

export const rollbackTemplateVersion = (templateId: string, version: number) =>
  api.post<EmailTemplate>(`/email-templates/${templateId}/rollback/${version}`, {});

// Delivery Logs
export const listDeliveryLogs = (params?: ListDeliveryLogsParams, signal?: AbortSignal) => {
  const qs = buildQueryString(params);
  return api.get<DeliveryLogsResponse>(`/email-templates/delivery-logs${qs}`, { signal });
};

// Suppressions
export const listSuppressions = (params?: ListSuppressionsParams, signal?: AbortSignal) => {
  const qs = buildQueryString(params);
  return api.get<SuppressionsResponse>(`/email-templates/suppressions${qs}`, { signal });
};

export const createSuppression = (data: CreateSuppressionInput) =>
  api.post<void>("/email-templates/suppressions", data);

export const deleteSuppression = (id: string) =>
  api.delete<{ message: string }>(`/email-templates/suppressions/${id}`);
