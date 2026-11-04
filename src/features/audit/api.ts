import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type { UpdateTenantAuditPolicyInput } from "./schemas";
import type { AuditLogsFilter, AuditLogsResponse, TenantAuditPolicy } from "./types";

export async function getTenantAuditLogs(
  tenantId: string,
  filters?: AuditLogsFilter,
  signal?: AbortSignal,
): Promise<AuditLogsResponse> {
  const query = filters ? buildQueryString(filters as Record<string, unknown>) : "";
  const endpoint = `/tenants/${tenantId}/audit${query ? `?${query}` : ""}`;
  return api.get<AuditLogsResponse>(endpoint, { signal });
}

export async function exportTenantAuditLogs(
  tenantId: string,
  filters?: AuditLogsFilter,
  format: "csv" | "json" = "csv",
): Promise<Blob> {
  const queryParams = { ...(filters ?? {}), format };
  const query = buildQueryString(queryParams as Record<string, unknown>);
  const endpoint = `/tenants/${tenantId}/audit/export${query ? `?${query}` : ""}`;

  const response = await fetch(`/api/proxy${endpoint}`, {
    method: "GET",
    headers: {
      Accept: format === "json" ? "application/json" : "text/csv",
    },
  });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  return response.blob();
}

export async function getTenantAuditPolicy(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantAuditPolicy> {
  return api.get<TenantAuditPolicy>(`/tenants/${tenantId}/audit/policy`, { signal });
}

export async function updateTenantAuditPolicy(
  tenantId: string,
  input: UpdateTenantAuditPolicyInput,
): Promise<TenantAuditPolicy> {
  return api.put<TenantAuditPolicy>(`/tenants/${tenantId}/audit/policy`, input);
}
