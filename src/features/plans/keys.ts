export const planKeys = {
  all: ["plans"] as const,
  public: () => [...planKeys.all, "public"] as const,
  platform: (params?: Record<string, unknown>) => [...planKeys.all, "platform", params] as const,
  subscription: () => [...planKeys.all, "subscription"] as const,
  platformSubscriptions: (params?: Record<string, unknown>) =>
    [...planKeys.all, "platform-subscriptions", params] as const,
  entitlements: () => [...planKeys.all, "entitlements"] as const,
};
