export const rbacKeys = {
  all: ["rbac"] as const,
  roles: (tenantId: string) => [...rbacKeys.all, "roles", tenantId] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
};
