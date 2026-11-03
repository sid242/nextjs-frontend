import type { GroupFilters } from "./types";

export const groupKeys = {
  // Tenant Scoped Keys
  tenantAll: (tenantId?: string) => ["tenant", tenantId ?? "unknown", "groups"] as const,
  tenantList: (tenantId?: string, filters?: GroupFilters) =>
    [...groupKeys.tenantAll(tenantId), "list", filters ?? {}] as const,
  tenantDetail: (tenantId?: string, groupId?: string) =>
    [...groupKeys.tenantAll(tenantId), "detail", groupId ?? ""] as const,
  tenantMembers: (tenantId?: string, groupId?: string, page = 1) =>
    [...groupKeys.tenantAll(tenantId), "members", groupId ?? "", page] as const,

  // Platform Scoped Keys
  platformAll: ["platform", "groups"] as const,
  platformList: (filters?: GroupFilters) =>
    [...groupKeys.platformAll, "list", filters ?? {}] as const,
  platformDetail: (groupId?: string) =>
    [...groupKeys.platformAll, "detail", groupId ?? ""] as const,
  platformMembers: (groupId?: string, page = 1) =>
    [...groupKeys.platformAll, "members", groupId ?? "", page] as const,
};
