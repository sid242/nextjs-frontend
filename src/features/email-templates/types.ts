export type EmailTemplateCategory = "MARKETING" | "TRANSACTIONAL" | "NOTIFICATION" | "CUSTOM";
export type EmailTemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  subject: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  description: string | null;
  htmlContent: string;
  designJson: Record<string, unknown> | null;
  variables: string[];
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEmailTemplateInput {
  name: string;
  slug?: string;
  subject: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  description?: string;
  htmlContent: string;
  designJson?: Record<string, unknown>;
  variables?: string[];
}

export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;

export interface TestSendEmailTemplateInput {
  to: string;
  variables?: Record<string, string>;
}

export interface ListEmailTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: EmailTemplateCategory;
  status?: EmailTemplateStatus;
}
