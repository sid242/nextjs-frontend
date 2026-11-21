import { api } from "@/lib/api/http";

import type {
  ActivityFeedItem,
  AnalyticsOverview,
  CreateReportDefinitionInput,
  PlatformMetrics,
  ReportDefinition,
  ReportRun,
  UsageDailyItem,
} from "./types";

// ─── Tenant Analytics ────────────────────────────────────────────────────────

export const getAnalyticsOverview = (tenantId: string, range: "7d" | "30d" | "90d" = "30d") =>
  api.get<AnalyticsOverview>(`/tenants/${tenantId}/analytics/overview?range=${range}`);

export const getTenantUsage = (
  tenantId: string,
  params?: { from?: string; to?: string; meter?: string },
) => {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.meter) query.set("meter", params.meter);
  const qs = query.toString();
  return api.get<UsageDailyItem[]>(`/tenants/${tenantId}/analytics/usage${qs ? `?${qs}` : ""}`);
};

export const getActivityFeed = (
  tenantId: string,
  params?: { limit?: number; cursor?: string; entityType?: string },
) => {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.entityType) query.set("entityType", params.entityType);
  const qs = query.toString();
  return api.get<ActivityFeedItem[]>(
    `/tenants/${tenantId}/analytics/activity${qs ? `?${qs}` : ""}`,
  );
};

// ─── Reports & Exports ───────────────────────────────────────────────────────

export const listReportDefinitions = (tenantId: string) =>
  api.get<ReportDefinition[]>(`/tenants/${tenantId}/analytics/reports/definitions`);

export const createReportDefinition = (tenantId: string, input: CreateReportDefinitionInput) =>
  api.post<ReportDefinition>(`/tenants/${tenantId}/analytics/reports/definitions`, input);

export const triggerReportRun = (tenantId: string, definitionId: string) =>
  api.post<ReportRun>(`/tenants/${tenantId}/analytics/reports/definitions/${definitionId}/run`);

export const listReportRuns = (tenantId: string, definitionId?: string) => {
  const query = definitionId ? `?definitionId=${encodeURIComponent(definitionId)}` : "";
  return api.get<ReportRun[]>(`/tenants/${tenantId}/analytics/reports/runs${query}`);
};

// ─── Platform Executive Metrics ──────────────────────────────────────────────

export const getPlatformMetricsOverview = () =>
  api.get<PlatformMetrics>("/platform/metrics/overview");
