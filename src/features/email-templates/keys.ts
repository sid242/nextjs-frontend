const all = ["email-templates"] as const;

export const emailTemplatesKeys = {
  all,
  list: (filters?: Record<string, unknown>) => [...all, "list", filters ?? {}] as const,
  detail: (id: string) => [...all, "detail", id] as const,
};
