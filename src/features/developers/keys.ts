export const developerKeys = {
  all: ["developers"] as const,
  apiKeys: (tenantId?: string) => [...developerKeys.all, "api-keys", tenantId] as const,
  webhooks: (tenantId?: string) => [...developerKeys.all, "webhooks", tenantId] as const,
  deliveries: (tenantId?: string, endpointId?: string) =>
    [...developerKeys.all, "deliveries", tenantId, endpointId] as const,
};
