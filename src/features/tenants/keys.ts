export const tenantKeys = {
  all: ["tenants"] as const,
  list: () => [...tenantKeys.all, "list"] as const,
  detail: (id: string) => [...tenantKeys.all, "detail", id] as const,
  branding: (id: string) => [...tenantKeys.all, "branding", id] as const,
  members: (id: string) => [...tenantKeys.all, "members", id] as const,
  emailConfig: (id: string) => [...tenantKeys.all, "emailConfig", id] as const,
  modules: (id: string) => [...tenantKeys.all, "modules", id] as const,
  auditLogs: (id: string, page = 1) => [...tenantKeys.all, "auditLogs", id, page] as const,
  auditLogsSearch: (id: string, criteria: Record<string, unknown>) =>
    [...tenantKeys.all, "auditLogsSearch", id, criteria] as const,
};
