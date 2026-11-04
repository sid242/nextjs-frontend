import type { AuditLogsFilter } from "./types";

export const auditKeys = {
  all: ["audit"] as const,
  tenant: (tenantId: string) => [...auditKeys.all, "tenant", tenantId] as const,
  logs: (tenantId: string, filters?: AuditLogsFilter) =>
    [...auditKeys.tenant(tenantId), "logs", filters] as const,
  policy: (tenantId: string) => [...auditKeys.tenant(tenantId), "policy"] as const,
};
