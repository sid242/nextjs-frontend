import { api } from "@/lib/api/http";

export const resolveFeatureFlags = (tenantId?: string) =>
  tenantId
    ? api.get<Record<string, unknown>>(`/tenants/${tenantId}/flags`)
    : api.get<Record<string, unknown>>("/feature-flags/resolve");

export const evaluateSingleFeatureFlag = (key: string, tenantId?: string) =>
  api.get<{ key: string; value: unknown }>(
    `/feature-flags/evaluate/${key}${tenantId ? `?tenantId=${tenantId}` : ""}`,
  );
