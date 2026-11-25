export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
  pushPublicKey: (scope: "tenant" | "platform") =>
    [...notificationKeys.all, "push-public-key", scope] as const,
  pushDevices: (scope: "tenant" | "platform") =>
    [...notificationKeys.all, "push-devices", scope] as const,
};
