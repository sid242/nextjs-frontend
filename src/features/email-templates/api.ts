import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type {
  CreateEmailTemplateInput,
  EmailTemplate,
  EmailTemplateListResponse,
  ListEmailTemplatesParams,
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
