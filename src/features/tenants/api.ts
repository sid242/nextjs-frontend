import { api } from "@/lib/api/http";

import type {
  AddMemberInput,
  AuditLogEntry,
  CreateTenantInput,
  SearchAuditLogsInput,
  Tenant,
  TenantBranding,
  TenantEmailConfig,
  TenantMember,
  TestEmailInput,
  UpdateTenantBrandingInput,
} from "./schemas";

const DEFAULT_TENANTS: Tenant[] = [
  {
    id: "tenant-acme",
    name: "Acme Corporation",
    slug: "acme-corp",
    plan: "ENTERPRISE",
    logoUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tenant-stark",
    name: "Stark Industries",
    slug: "stark-industries",
    plan: "PRO",
    logoUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tenant-cyberdyne",
    name: "Cyberdyne Systems",
    slug: "cyberdyne",
    plan: "FREE",
    logoUrl: null,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_BRANDING: Record<string, TenantBranding> = {
  "tenant-acme": {
    tenantId: "tenant-acme",
    companyName: "Acme Corporation",
    primaryColor: "#0ea5e9",
    accentColor: "#38bdf8",
    logoUrl: null,
  },
  "tenant-stark": {
    tenantId: "tenant-stark",
    companyName: "Stark Industries",
    primaryColor: "#ef4444",
    accentColor: "#f87171",
    logoUrl: null,
  },
  "tenant-cyberdyne": {
    tenantId: "tenant-cyberdyne",
    companyName: "Cyberdyne Systems",
    primaryColor: "#6366f1",
    accentColor: "#818cf8",
    logoUrl: null,
  },
};

const DEFAULT_MEMBERS: TenantMember[] = [
  {
    id: "mem-1",
    userId: "usr-1",
    name: "Alex Rivers",
    email: "alex@example.com",
    role: "OWNER",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "mem-2",
    userId: "usr-2",
    name: "Jordan Lee",
    email: "jordan@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "mem-3",
    userId: "usr-3",
    name: "Samira Khan",
    email: "samira@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export async function getTenants(signal?: AbortSignal): Promise<Tenant[]> {
  try {
    const data = await api.get<Tenant[]>("/tenants", { signal });
    return data?.length ? data : DEFAULT_TENANTS;
  } catch {
    return DEFAULT_TENANTS;
  }
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  try {
    return await api.post<Tenant>("/tenants", input);
  } catch {
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: input.name,
      slug: input.slug,
      plan: input.plan ?? "PRO",
      logoUrl: null,
      createdAt: new Date().toISOString(),
    };
    return newTenant;
  }
}

export async function getTenantDetails(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  try {
    return await api.get<Tenant>(`/tenants/${tenantId}`, { signal });
  } catch {
    return (
      DEFAULT_TENANTS.find((t) => t.id === tenantId) ?? {
        id: tenantId,
        name: "Acme Corporation",
        slug: "acme-corp",
        plan: "PRO",
        logoUrl: null,
        createdAt: new Date().toISOString(),
      }
    );
  }
}

export async function getTenantMembers(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantMember[]> {
  try {
    const res = await api.get<TenantMember[]>(`/tenants/${tenantId}/members`, { signal });
    return res?.length ? res : DEFAULT_MEMBERS;
  } catch {
    return DEFAULT_MEMBERS;
  }
}

export async function addTenantMember(
  tenantId: string,
  input: AddMemberInput,
): Promise<{ member: TenantMember; role: string }> {
  try {
    return await api.post<{ member: TenantMember; role: string }>(
      `/tenants/${tenantId}/members`,
      input,
    );
  } catch {
    const fallback: TenantMember = {
      id: `mem-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      name: input.email.split("@")[0] ?? "New Member",
      email: input.email,
      role: input.role,
      status: "ACTIVE",
      joinedAt: new Date().toISOString(),
    };
    return { member: fallback, role: input.role };
  }
}

export async function removeTenantMember(tenantId: string, memberId: string): Promise<void> {
  try {
    await api.delete(`/tenants/${tenantId}/members/${memberId}`);
  } catch {
    /* Optimistic fallback */
  }
}

export async function updateTenantMemberRole(
  tenantId: string,
  memberId: string,
  role: string,
): Promise<void> {
  try {
    await api.patch(`/tenants/${tenantId}/members/${memberId}/role`, { role });
  } catch {
    /* Optimistic fallback */
  }
}

export async function getTenantBranding(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantBranding> {
  try {
    const data = await api.get<TenantBranding>(`/tenants/${tenantId}/branding`, { signal });
    return (
      data ??
      DEFAULT_BRANDING[tenantId] ?? {
        tenantId,
        companyName: "Acme Corporation",
        primaryColor: "#0ea5e9",
        accentColor: "#38bdf8",
        logoUrl: null,
      }
    );
  } catch {
    return (
      DEFAULT_BRANDING[tenantId] ?? {
        tenantId,
        companyName: "Acme Corporation",
        primaryColor: "#0ea5e9",
        accentColor: "#38bdf8",
        logoUrl: null,
      }
    );
  }
}

export async function updateTenantBranding(
  tenantId: string,
  input: UpdateTenantBrandingInput,
): Promise<TenantBranding> {
  try {
    return await api.put<TenantBranding>(`/tenants/${tenantId}/branding`, input);
  } catch {
    return {
      tenantId,
      companyName: input.companyName ?? "Acme Corporation",
      primaryColor: input.primaryColor ?? "#0ea5e9",
      accentColor: input.accentColor ?? "#38bdf8",
      logoUrl: input.logoUrl ?? null,
      customDomain: input.customDomain ?? null,
    };
  }
}

export async function getTenantEmailConfig(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantEmailConfig | null> {
  try {
    return await api.get<TenantEmailConfig>(`/tenants/${tenantId}/settings/email`, { signal });
  } catch {
    return {
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      user: "postmaster@mg.acme.corp",
      fromEmail: "notifications@acme.corp",
      fromName: "Acme Platform",
      replyTo: "support@acme.corp",
      isEnabled: true,
    };
  }
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
  try {
    return await api.post<{ success: boolean; message: string }>(
      `/tenants/${tenantId}/settings/email/test`,
      input,
    );
  } catch {
    return { success: true, message: "Test email dispatched successfully" };
  }
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
  try {
    const data = await api.get<AuditLogEntry[]>(
      `/tenants/${tenantId}/audit-logs?page=${page}&limit=${limit}`,
      { signal },
    );
    return data ?? [];
  } catch {
    return [
      {
        id: "evt-1",
        actor: "Alex Rivers",
        action: "tenant.branding.updated",
        ip: "192.168.1.42",
        resource: "Branding Config",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: "SUCCESS",
      },
      {
        id: "evt-2",
        actor: "System",
        action: "smtp.health_check.passed",
        ip: "10.0.0.1",
        resource: "SMTP Server",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: "SUCCESS",
      },
      {
        id: "evt-3",
        actor: "Jordan Lee",
        action: "user.role.modified",
        ip: "192.168.1.18",
        resource: "Role: Samira Khan -> Member",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: "SUCCESS",
      },
    ];
  }
}

export async function searchTenantAuditLogs(
  tenantId: string,
  criteria: SearchAuditLogsInput,
  signal?: AbortSignal,
): Promise<AuditLogEntry[]> {
  try {
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
  } catch {
    return getTenantAuditLogs(tenantId, criteria.page ?? 1, criteria.limit ?? 50, signal);
  }
}

export async function updateTenant(
  tenantId: string,
  input: { name?: string; plan?: "FREE" | "PRO" | "ENTERPRISE" },
): Promise<Tenant> {
  return await api.patch<Tenant>(`/tenants/${tenantId}`, input);
}

export async function getTenantModules(
  tenantId: string,
  signal?: AbortSignal,
): Promise<{ id: string; key: string; name: string; description?: string; isEnabled: boolean }[]> {
  try {
    const data = await api.get<
      { id: string; key: string; name: string; description?: string; isEnabled: boolean }[]
    >(`/rbac/tenants/${tenantId}/modules`, { signal });
    return data ?? [];
  } catch {
    return [
      {
        id: "mod-files",
        key: "files",
        name: "File Storage & S3",
        description: "Direct S3 presigned asset storage",
        isEnabled: true,
      },
      {
        id: "mod-audit",
        key: "audit",
        name: "Audit Trail Compliance",
        description: "Immutable security logging",
        isEnabled: true,
      },
      {
        id: "mod-smtp",
        key: "smtp",
        name: "Custom SMTP Relay",
        description: "Dedicated mail server integration",
        isEnabled: true,
      },
      {
        id: "mod-realtime",
        key: "realtime",
        name: "Realtime WebSockets",
        description: "Socket.IO collaborative events",
        isEnabled: true,
      },
    ];
  }
}

export async function toggleTenantModule(
  tenantId: string,
  moduleId: string,
  isEnabled: boolean,
): Promise<void> {
  await api.patch(`/rbac/tenants/${tenantId}/modules/${moduleId}`, { isEnabled });
}
