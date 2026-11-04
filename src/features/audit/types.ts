export type AuditLogSource = "DIRECT" | "GROUP" | "IMPERSONATION" | "SYSTEM" | "JOB" | string;
export type AuditLogResult = "SUCCESS" | "FAILURE" | "DENIED" | string;

export interface AuditLog {
  id: string;
  tenantId: string | null;
  action: string;
  source: AuditLogSource;
  result: AuditLogResult;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  effectiveUserId: string | null;
  effectiveUserName: string | null;
  effectiveUserEmail: string | null;
  entityType?: string | null;
  entityId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId: string | null;
  correlationId: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata?: Record<string, unknown> | null;
  metadataBefore?: Record<string, unknown> | null;
  metadataAfter?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TenantAuditPolicy {
  id: string;
  tenantId: string;
  retentionDays: number;
  exportAllowed: boolean;
  complianceFramework: string;
  lastArchivedAt: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogsFilter {
  page?: number;
  limit?: number;
  actorUserId?: string;
  effectiveUserId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: AuditLogResult;
  source?: AuditLogSource;
  startDate?: string;
  endDate?: string;
  requestId?: string;
  correlationId?: string;
  search?: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
