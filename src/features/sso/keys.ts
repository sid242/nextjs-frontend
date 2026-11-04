export const ssoKeys = {
  all: ["sso"] as const,
  config: (tenantId: string) => [...ssoKeys.all, "config", tenantId] as const,
  tokens: (tenantId: string) => [...ssoKeys.all, "tokens", tenantId] as const,
  lookup: (email: string) => [...ssoKeys.all, "lookup", email] as const,
};
