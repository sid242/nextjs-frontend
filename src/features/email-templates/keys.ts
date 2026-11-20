const all = ["email-templates"] as const;

export const emailTemplatesKeys = {
  all,
  list: (filters?: Record<string, unknown>) => [...all, "list", filters ?? {}] as const,
  detail: (id: string) => [...all, "detail", id] as const,
  versions: (id: string) => [...all, "versions", id] as const,
  deliveryLogs: (filters?: Record<string, unknown>) =>
    [...all, "delivery-logs", filters ?? {}] as const,
  suppressions: (filters?: Record<string, unknown>) =>
    [...all, "suppressions", filters ?? {}] as const,
};
