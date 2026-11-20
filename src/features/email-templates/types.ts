export type EmailTemplateCategory = "MARKETING" | "TRANSACTIONAL" | "NOTIFICATION" | "CUSTOM";
export type EmailTemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EmailDeliveryStatus =
  "QUEUED" | "SENT" | "DELIVERED" | "BOUNCED" | "COMPLAINED" | "FAILED";
export type EmailSuppressionReason = "BOUNCE" | "COMPLAINT" | "UNSUBSCRIBE" | "MANUAL";

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  locale: string;
  subject: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  description: string | null;
  senderName: string | null;
  fromEmail: string | null;
  replyTo: string | null;
  htmlContent: string;
  designJson: Record<string, unknown> | null;
  variables: string[];
  currentVersion: number;
  isSystemOverride: boolean;
  lastPublishedAt?: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateVersion {
  id: string;
  tenantId: string;
  templateId: string;
  version: number;
  subject: string;
  htmlContent: string;
  designJson: Record<string, unknown> | null;
  variables: string[];
  createdById: string | null;
  createdAt: string;
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
  locale?: string;
  subject: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  description?: string;
  senderName?: string;
  fromEmail?: string;
  replyTo?: string;
  htmlContent: string;
  designJson?: Record<string, unknown>;
  variables?: string[];
  isSystemOverride?: boolean;
}

export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;

export interface TestSendEmailTemplateInput {
  to: string;
  variables?: Record<string, unknown>;
}

export interface ListEmailTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: EmailTemplateCategory;
  status?: EmailTemplateStatus;
  locale?: string;
}

export interface EmailMessageRecord {
  id: string;
  tenantId: string;
  templateId?: string | null;
  templateSlug?: string | null;
  to: string;
  subject: string;
  status: EmailDeliveryStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  attempts: number;
  lastError?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
}

export interface ListDeliveryLogsParams {
  page?: number;
  limit?: number;
  status?: EmailDeliveryStatus;
  to?: string;
  search?: string;
}

export interface DeliveryLogsResponse {
  messages: EmailMessageRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface EmailSuppressionRecord {
  id: string;
  tenantId: string;
  email: string;
  reason: EmailSuppressionReason;
  details?: string | null;
  createdAt: string;
}

export interface ListSuppressionsParams {
  page?: number;
  limit?: number;
  reason?: EmailSuppressionReason;
  search?: string;
}

export interface SuppressionsResponse {
  suppressions: EmailSuppressionRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSuppressionInput {
  email: string;
  reason?: EmailSuppressionReason;
  details?: string;
}
