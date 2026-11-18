export const authKeys = {
  all: ["auth"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  twoFactorStatus: () => [...authKeys.all, "2fa", "status"] as const,
  loginHistory: (page?: number, limit?: number) =>
    [...authKeys.all, "login-history", page ?? 1, limit ?? 10] as const,
};
