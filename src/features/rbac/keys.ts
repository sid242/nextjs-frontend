export const rbacKeys = {
  all: ["rbac"] as const,
  roles: (tenantId: string) => [...rbacKeys.all, "roles", tenantId] as const,
  platformRoles: () => [...rbacKeys.all, "platform-roles"] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  modules: () => [...rbacKeys.all, "modules"] as const,
};
