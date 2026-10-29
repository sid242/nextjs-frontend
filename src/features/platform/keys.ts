export const platformKeys = {
  all: ["platform"] as const,
  staff: () => [...platformKeys.all, "staff"] as const,
  staffList: (params?: unknown) => [...platformKeys.staff(), "list", params] as const,
  staffDetail: (id: string) => [...platformKeys.staff(), "detail", id] as const,

  users: () => [...platformKeys.all, "users"] as const,
  usersList: (params?: unknown) => [...platformKeys.users(), "list", params] as const,
  userDetail: (id: string) => [...platformKeys.users(), "detail", id] as const,

  roles: () => [...platformKeys.all, "roles"] as const,
  rolesList: () => [...platformKeys.roles(), "list"] as const,
  roleDetail: (id: string) => [...platformKeys.roles(), "detail", id] as const,

  permissions: () => [...platformKeys.all, "permissions"] as const,

  supportSessions: () => [...platformKeys.all, "support-sessions"] as const,
  supportSessionsList: (params?: unknown) =>
    [...platformKeys.supportSessions(), "list", params] as const,

  auditLogs: () => [...platformKeys.all, "audit-logs"] as const,
  auditLogsList: (params?: unknown) => [...platformKeys.auditLogs(), "list", params] as const,

  tenants: () => [...platformKeys.all, "tenants"] as const,
  tenantsList: (params?: unknown) => [...platformKeys.tenants(), "list", params] as const,
  tenantDetail: (id: string) => [...platformKeys.tenants(), "detail", id] as const,
  tenantMembers: (tenantId: string) => [...platformKeys.tenants(), tenantId, "members"] as const,
  tenantDbHealth: (tenantId: string) => [...platformKeys.tenants(), tenantId, "db-health"] as const,

  me: () => [...platformKeys.all, "me"] as const,
  twoFactorStatus: () => [...platformKeys.all, "2fa", "status"] as const,
};
