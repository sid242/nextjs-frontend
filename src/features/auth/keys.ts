export const authKeys = {
  all: ["auth"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  twoFactorStatus: () => [...authKeys.all, "2fa", "status"] as const,
};
