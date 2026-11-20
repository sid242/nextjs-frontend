import { api } from "@/lib/api/http";

import type { RequestAccountDeletionInput, RequestTenantClosureInput } from "./schemas";
import type {
  AccountDeletionStatus,
  ConsentStatusResponse,
  DataExportRequest,
  TenantClosureStatus,
} from "./types";

// User Privacy & DSAR
export const requestUserDataExport = () => api.post<DataExportRequest>("/users/me/data-export");

export const listUserDataExports = () => api.get<DataExportRequest[]>("/users/me/data-exports");

export const requestAccountDeletion = (data: RequestAccountDeletionInput) =>
  api.post<AccountDeletionStatus>("/users/me/delete-request", data);

export const cancelAccountDeletion = () =>
  api.post<{ success: boolean; message: string }>("/users/me/delete-request/cancel");

export const getAccountDeletionStatus = () =>
  api.get<AccountDeletionStatus | null>("/users/me/delete-request");

// Workspace Privacy & Closure
export const requestTenantDataExport = (tenantId: string) =>
  api.post<DataExportRequest>(`/tenants/${tenantId}/data-export`);

export const listTenantDataExports = (tenantId: string) =>
  api.get<DataExportRequest[]>(`/tenants/${tenantId}/data-exports`);

export const requestTenantClosure = (tenantId: string, data: RequestTenantClosureInput) =>
  api.post<{
    tenantId: string;
    name: string;
    slug: string;
    closedAt: string;
    purgeScheduledAt: string;
    gracePeriodDays: number;
    status: string;
  }>(`/tenants/${tenantId}/close`, data);

export const cancelTenantClosure = (tenantId: string) =>
  api.post<{ tenantId: string; name: string; slug: string; status: string; message: string }>(
    `/tenants/${tenantId}/close/cancel`,
  );

export const getTenantClosureStatus = (tenantId: string) =>
  api.get<TenantClosureStatus>(`/tenants/${tenantId}/close`);

// Consents
export const getConsentStatus = () => api.get<ConsentStatusResponse>("/consent/status");

export const recordConsent = (data: { type: string; version: string; tenantId?: string }) =>
  api.post<{ id: string; type: string; version: string }>("/consent", data);
