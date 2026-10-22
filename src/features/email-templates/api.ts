import { api } from "@/lib/api/http";

import type {
  CreateEmailTemplateInput,
  EmailTemplate,
  EmailTemplateListResponse,
  ListEmailTemplatesParams,
  TestSendEmailTemplateInput,
  UpdateEmailTemplateInput,
} from "./types";

export const listEmailTemplates = (params?: ListEmailTemplatesParams, signal?: AbortSignal) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return api.get<EmailTemplateListResponse>(`/email-templates${qs ? `?${qs}` : ""}`, { signal });
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
