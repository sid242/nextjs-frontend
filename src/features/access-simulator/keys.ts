export const accessSimulatorKeys = {
  all: ["access-simulator"] as const,
  tenant: (tenantId: string) => [...accessSimulatorKeys.all, "tenant", tenantId] as const,
  effective: (tenantId: string, userId: string) =>
    [...accessSimulatorKeys.tenant(tenantId), "effective", userId] as const,
};
