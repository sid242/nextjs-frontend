import { api } from "@/lib/api/http";

import type {
  AddMemberInput,
  AuditLogEntry,
  CreateTenantInput,
  OffboardMemberInput,
  SearchAuditLogsInput,
  Tenant,
  TenantBranding,
  TenantContext,
  TenantEmailConfig,
  TenantMember,
  TenantSecurityPolicy,
  TenantSettings,
  TenantUrlSettings,
  TestEmailInput,
  UpdateTenantBrandingInput,
  UpdateTenantInput,
  UpdateTenantUrlSettingsInput,
} from "./schemas";

export async function getTenants(signal?: AbortSignal): Promise<Tenant[]> {
  const data = await api.get<Tenant[]>("/tenants", { signal });
  return Array.isArray(data) ? data : [];
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  return await api.post<Tenant>("/tenants", input);
}

export async function checkTenantSlug(
  slug: string,
  signal?: AbortSignal,
): Promise<{ slug: string; available: boolean }> {
  return await api.get<{ slug: string; available: boolean }>(
    `/tenants/check-slug?slug=${encodeURIComponent(slug)}`,
    { signal },
  );
}

export async function checkMemberEmail(
  tenantId: string,
  email: string,
  signal?: AbortSignal,
): Promise<{ email: string; available: boolean; existsInWorkspace: boolean }> {
  return await api.get<{ email: string; available: boolean; existsInWorkspace: boolean }>(
    `/tenants/${tenantId}/members/check-email?email=${encodeURIComponent(email)}`,
    { signal },
  );
}

export async function getTenantDetails(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  return await api.get<Tenant>(`/tenants/${tenantId}`, { signal });
}

export async function getTenantMembers(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantMember[]> {
  const res = await api.get<unknown>(`/tenants/${tenantId}/members`, { signal });
  if (Array.isArray(res)) return res as TenantMember[];
  if (res && typeof res === "object") {
    if ("items" in res && Array.isArray((res as { items: unknown }).items)) {
      return (res as { items: TenantMember[] }).items;
    }
    if ("data" in res && Array.isArray((res as { data: unknown }).data)) {
      return (res as { data: TenantMember[] }).data;
    }
  }
  return [];
}

export async function addTenantMember(
  tenantId: string,
  input: AddMemberInput,
): Promise<{
  member: TenantMember;
  role: string;
  inviteToken?: string;
  inviteUrl?: string;
  message?: string;
}> {
  return await api.post<{
    member: TenantMember;
    role: string;
    inviteToken?: string;
    inviteUrl?: string;
    message?: string;
  }>(`/tenants/${tenantId}/members`, input);
}

export async function removeTenantMember(tenantId: string, memberId: string): Promise<void> {
  await api.delete(`/tenants/${tenantId}/members/${memberId}`);
}

export async function offboardTenantMember(
  tenantId: string,
  memberId: string,
  input?: OffboardMemberInput,
): Promise<{
  message: string;
  member: TenantMember;
  reassignedFilesCount: number;
}> {
  return await api.post(`/tenants/${tenantId}/members/${memberId}/offboard`, input ?? {});
}

export async function exportTenantMembers(
  tenantId: string,
  format: "csv" | "json" = "csv",
): Promise<void> {
  const url = `/api/proxy/v1/tenants/${tenantId}/members/export?format=${format}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: format === "csv" ? "text/csv" : "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to export tenant members");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `members-${new Date().toISOString().split("T")[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function updateTenantMemberRole(
  tenantId: string,
  memberId: string,
  role: string,
): Promise<void> {
  await api.patch(`/tenants/${tenantId}/members/${memberId}/role`, { role });
}

export async function getTenantBranding(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantBranding | null> {
  const data = await api.get<TenantBranding>(`/tenants/${tenantId}/branding`, { signal });
  return data ?? null;
}

export async function updateTenantBranding(
  tenantId: string,
  input: UpdateTenantBrandingInput,
): Promise<TenantBranding> {
  return await api.put<TenantBranding>(`/tenants/${tenantId}/branding`, input);
}

export async function verifyTenantCustomDomain(
  tenantId: string,
  bypassVerification?: boolean,
): Promise<TenantBranding> {
  return api.post<TenantBranding>(`/tenants/${tenantId}/branding/domain/verify`, {
    bypassVerification,
  });
}

export interface PresignedBrandingUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  key: string;
  publicUrl: string;
}

export async function requestBrandingUploadUrl(
  tenantId: string,
  input: {
    type: "logo" | "logo-dark" | "favicon" | "cover";
    filename: string;
    contentType: string;
  },
): Promise<PresignedBrandingUploadResponse> {
  return await api.post<PresignedBrandingUploadResponse>(
    `/tenants/${tenantId}/branding/logo-presigned`,
    input,
  );
}

export async function uploadBrandingAsset(
  uploadUrl: string,
  fields: Record<string, string>,
  file: File,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    form.append("file", file); // AWS S3 requires file to be the last field

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let errorMsg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const match = xhr.responseText.match(/<Message>(.*?)<\/Message>/);
          if (match?.[1]) {
            errorMsg = `Storage upload rejected: ${match[1]}`;
          }
        } catch {
          // fallback to status code
        }
        reject(new Error(errorMsg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during asset upload to storage"));
    xhr.send(form);
  });
}

export async function getTenantEmailConfig(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantEmailConfig | null> {
  return await api.get<TenantEmailConfig>(`/tenants/${tenantId}/settings/email`, { signal });
}

export async function saveTenantEmailConfig(
  tenantId: string,
  input: TenantEmailConfig,
): Promise<void> {
  await api.put(`/tenants/${tenantId}/settings/email`, input);
}

export async function testTenantEmailConfig(
  tenantId: string,
  input: TestEmailInput,
): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>(
    `/tenants/${tenantId}/settings/email/test`,
    input,
  );
}

export async function deleteTenantEmailConfig(tenantId: string): Promise<void> {
  await api.delete(`/tenants/${tenantId}/settings/email`);
}

export async function getTenantAuditLogs(
  tenantId: string,
  page = 1,
  limit = 50,
  signal?: AbortSignal,
): Promise<AuditLogEntry[]> {
  const data = await api.get<AuditLogEntry[]>(
    `/tenants/${tenantId}/audit-logs?page=${page}&limit=${limit}`,
    { signal },
  );
  return Array.isArray(data) ? data : [];
}

export async function searchTenantAuditLogs(
  tenantId: string,
  criteria: SearchAuditLogsInput,
  signal?: AbortSignal,
): Promise<AuditLogEntry[]> {
  const data = await api.post<AuditLogEntry[] | { items: AuditLogEntry[] }>(
    `/tenants/${tenantId}/audit-logs/search`,
    criteria,
    { signal },
  );
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: AuditLogEntry[] }).items)
  ) {
    return (data as { items: AuditLogEntry[] }).items;
  }
  return [];
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
  return await api.patch<Tenant>(`/tenants/${tenantId}`, input);
}

export async function changeTenantSlug(tenantId: string, slug: string): Promise<Tenant> {
  return await api.patch<Tenant>(`/tenants/${tenantId}/slug`, { slug });
}

export async function getTenantModules(
  tenantId: string,
  signal?: AbortSignal,
): Promise<{ id: string; key: string; name: string; description?: string; isEnabled: boolean }[]> {
  const data = await api.get<
    { id: string; key: string; name: string; description?: string; isEnabled: boolean }[]
  >(`/rbac/tenants/${tenantId}/modules`, { signal });
  return data ?? [];
}

export async function toggleTenantModule(
  tenantId: string,
  moduleId: string,
  isEnabled: boolean,
): Promise<void> {
  await api.patch(`/rbac/tenants/${tenantId}/modules/${moduleId}`, { isEnabled });
}

export async function transferTenantOwnership(
  tenantId: string,
  memberId: string,
  newRoleForFormerOwner = "ADMIN",
): Promise<{
  newOwnerId: string;
  formerOwnerRole: string;
  message: string;
}> {
  return api.post<{
    newOwnerId: string;
    formerOwnerRole: string;
    message: string;
  }>(`/tenants/${tenantId}/members/${memberId}/transfer-ownership`, {
    newRoleForFormerOwner,
  });
}

export async function getTenantContext(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantContext> {
  return api.get<TenantContext>(`/tenants/${tenantId}/context`, { signal });
}

export async function getTenantUrlSettings(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantUrlSettings> {
  return api.get<TenantUrlSettings>(`/tenants/${tenantId}/url-settings`, { signal });
}

export async function updateTenantUrlSettings(
  tenantId: string,
  input: UpdateTenantUrlSettingsInput,
): Promise<TenantUrlSettings> {
  return api.put<TenantUrlSettings>(`/tenants/${tenantId}/url-settings`, input);
}

export async function deleteTenantCustomDomain(tenantId: string): Promise<TenantUrlSettings> {
  return api.delete<TenantUrlSettings>(`/tenants/${tenantId}/url-settings/custom-domain`);
}

export async function getTenantSettings(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantSettings> {
  return api.get<TenantSettings>(`/tenants/${tenantId}/settings`, { signal });
}

export async function updateTenantSettings(
  tenantId: string,
  input: Partial<TenantSettings>,
): Promise<TenantSettings> {
  return api.patch<TenantSettings>(`/tenants/${tenantId}/settings`, input);
}

export async function getTenantSecurityPolicy(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantSecurityPolicy> {
  return api.get<TenantSecurityPolicy>(`/tenants/${tenantId}/settings/security`, { signal });
}

export async function updateTenantSecurityPolicy(
  tenantId: string,
  input: Partial<TenantSecurityPolicy>,
): Promise<TenantSecurityPolicy> {
  return api.patch<TenantSecurityPolicy>(`/tenants/${tenantId}/settings/security`, input);
}
