import { api } from "@/lib/api/http";

import type {
  CreatePlatformRoleInput,
  CreateStaffInput,
  PlatformAuditLog,
  PlatformLoginInput,
  PlatformPermission,
  PlatformRole,
  PlatformSupportSession,
  PlatformTenant,
  PlatformTenantDetail,
  PlatformTenantMember,
  ProvisionTenantInput,
  StaffAuthProfile,
  StaffMember,
  StartSupportSessionInput,
  StartSupportSessionResponse,
  UpdatePlatformRoleInput,
  UpdatePlatformTenantInput,
  UpdatePlatformTenantSubscriptionInput,
  UpdateStaffInput,
} from "./schemas";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// 1. Staff Management
// ==========================================

export async function getStaffMembers(
  params?: { page?: number; limit?: number; status?: string; roleId?: string },
  signal?: AbortSignal,
): Promise<PaginatedResult<StaffMember>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.roleId) query.set("roleId", params.roleId);

  const qs = query.toString();
  return api.get<PaginatedResult<StaffMember>>(`/platform/staff${qs ? `?${qs}` : ""}`, { signal });
}

export async function getStaffMember(id: string, signal?: AbortSignal): Promise<StaffMember> {
  return api.get<StaffMember>(`/platform/staff/${id}`, { signal });
}

export async function createStaffMember(input: CreateStaffInput): Promise<StaffMember> {
  return api.post<StaffMember>("/platform/staff", input);
}

export async function updateStaffMember(id: string, input: UpdateStaffInput): Promise<StaffMember> {
  return api.patch<StaffMember>(`/platform/staff/${id}`, input);
}

// ==========================================
// 2. Platform Roles & Permissions
// ==========================================

export async function getPlatformRoles(signal?: AbortSignal): Promise<PlatformRole[]> {
  return api.get<PlatformRole[]>("/platform/roles", { signal });
}

export async function getPlatformRole(id: string, signal?: AbortSignal): Promise<PlatformRole> {
  return api.get<PlatformRole>(`/platform/roles/${id}`, { signal });
}

export async function createPlatformRole(input: CreatePlatformRoleInput): Promise<PlatformRole> {
  return api.post<PlatformRole>("/platform/roles", input);
}

export async function updatePlatformRole(
  id: string,
  input: UpdatePlatformRoleInput,
): Promise<PlatformRole> {
  return api.patch<PlatformRole>(`/platform/roles/${id}`, input);
}

export async function getPlatformPermissions(signal?: AbortSignal): Promise<PlatformPermission[]> {
  return api.get<PlatformPermission[]>("/platform/permissions", { signal });
}

// ==========================================
// 3. Audited Support Sessions
// ==========================================

export async function getSupportSessions(
  params?: { page?: number; limit?: number },
  signal?: AbortSignal,
): Promise<PaginatedResult<PlatformSupportSession>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return api.get<PaginatedResult<PlatformSupportSession>>(
    `/platform/support-sessions${qs ? `?${qs}` : ""}`,
    { signal },
  );
}

export async function startSupportSession(
  input: StartSupportSessionInput,
): Promise<StartSupportSessionResponse> {
  return api.post<StartSupportSessionResponse>(
    `/platform/tenants/${input.tenantId}/support-sessions`,
    {
      reason: input.reason,
      durationMinutes: input.durationMinutes,
      targetUserId: input?.targetUserId ? input.targetUserId.trim() : undefined,
    },
  );
}

export async function getTenantMembers(
  tenantId: string,
  signal?: AbortSignal,
): Promise<PlatformTenantMember[]> {
  return api.get<PlatformTenantMember[]>(`/platform/tenants/${tenantId}/members`, { signal });
}

export async function endSupportSession(
  sessionId: string,
  outcome?: string,
): Promise<PlatformSupportSession> {
  return api.post<PlatformSupportSession>(`/platform/support-sessions/${sessionId}/end`, {
    outcome,
  });
}

// ==========================================
// 4. Platform Audit Trail
// ==========================================

export async function getPlatformAuditLogs(
  params?: {
    page?: number;
    limit?: number;
    actorStaffId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  },
  signal?: AbortSignal,
): Promise<PaginatedResult<PlatformAuditLog>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.actorStaffId) query.set("actorStaffId", params.actorStaffId);
  if (params?.action) query.set("action", params.action);
  if (params?.targetType) query.set("targetType", params.targetType);
  if (params?.targetId) query.set("targetId", params.targetId);
  if (params?.tenantId) query.set("tenantId", params.tenantId);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);

  const qs = query.toString();
  return api.get<PaginatedResult<PlatformAuditLog>>(`/platform/audit-logs${qs ? `?${qs}` : ""}`, {
    signal,
  });
}

// ==========================================
// 5. Staff Authentication
// ==========================================

export async function loginPlatformStaff(
  credentials: PlatformLoginInput,
): Promise<{ token: string; staff: StaffAuthProfile }> {
  return api.post<{ token: string; staff: StaffAuthProfile }>("/platform/auth/login", credentials);
}

export async function getPlatformMe(signal?: AbortSignal): Promise<StaffAuthProfile> {
  return api.get<StaffAuthProfile>("/platform/auth/me", { signal });
}

export async function logoutPlatformStaff(): Promise<void> {
  return api.post<void>("/platform/auth/logout");
}

// ==========================================
// 6. Platform Tenant Oversight & Provisioning
// ==========================================

export async function getPlatformTenants(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
    databaseMode?: string;
  },
  signal?: AbortSignal,
): Promise<PaginatedResult<PlatformTenant>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.plan) query.set("plan", params.plan);
  if (params?.databaseMode) query.set("databaseMode", params.databaseMode);

  const qs = query.toString();
  return api.get<PaginatedResult<PlatformTenant>>(`/platform/tenants${qs ? `?${qs}` : ""}`, {
    signal,
  });
}

export async function getPlatformTenant(
  id: string,
  signal?: AbortSignal,
): Promise<PlatformTenantDetail> {
  return api.get<PlatformTenantDetail>(`/platform/tenants/${id}`, { signal });
}

export async function provisionTenant(input: ProvisionTenantInput): Promise<{
  tenant: PlatformTenant;
  owner: { id: string; email: string; name: string };
  inviteUrl: string;
  inviteToken: string;
}> {
  return api.post<{
    tenant: PlatformTenant;
    owner: { id: string; email: string; name: string };
    inviteUrl: string;
    inviteToken: string;
  }>("/platform/tenants", input);
}

export async function updatePlatformTenant(
  id: string,
  input: UpdatePlatformTenantInput,
): Promise<PlatformTenant> {
  return api.patch<PlatformTenant>(`/platform/tenants/${id}`, input);
}

export async function suspendTenant(id: string, reason: string): Promise<PlatformTenant> {
  return api.post<PlatformTenant>(`/platform/tenants/${id}/suspend`, { reason });
}

export async function activateTenant(id: string, reason?: string): Promise<PlatformTenant> {
  return api.post<PlatformTenant>(`/platform/tenants/${id}/activate`, { reason });
}

export async function getPlatformTenantSubscription(
  tenantId: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  return api.get<Record<string, unknown>>(`/platform/tenants/${tenantId}/subscription`, { signal });
}

export async function updatePlatformTenantSubscription(
  tenantId: string,
  input: UpdatePlatformTenantSubscriptionInput,
): Promise<Record<string, unknown>> {
  return api.patch<Record<string, unknown>>(`/platform/tenants/${tenantId}/subscription`, input);
}
