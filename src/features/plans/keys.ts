export const planKeys = {
  all: ["plans"] as const,
  public: () => [...planKeys.all, "public"] as const,
  platform: (params?: { includeInactive?: boolean }) =>
    [...planKeys.all, "platform", params] as const,
  subscription: () => [...planKeys.all, "subscription"] as const,
};
