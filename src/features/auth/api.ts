import { authApi } from "@/lib/api/http";
import type { User } from "@/lib/api/types";

import type {
  ChangePasswordValues,
  ForgotPasswordValues,
  LoginValues,
  RegisterValues,
  RequestEmailVerificationValues,
  RequestMagicLinkValues,
  ResetPasswordValues,
  TwoFactorChallengeValues,
  TwoFactorCodeValues,
  TwoFactorDisableValues,
  TwoFactorEnableData,
  TwoFactorSetupData,
  TwoFactorStatus,
  UserSession,
  VerifyMagicLinkValues,
} from "./schemas";

export type LoginResult =
  | { user: User; twoFactorRequired?: false }
  | { user?: never; twoFactorRequired: true; challengeToken: string; method: "totp" };

// These hit our own Next.js BFF routes (/api/auth/*), which keep tokens in httpOnly cookies.
export const login = (values: LoginValues) => authApi.post<LoginResult>("/login", values);
export const register = (values: RegisterValues) =>
  authApi.post<{ user: User }>("/register", values);
export const logout = () => authApi.post("/logout");

// ─── Two-Factor Authentication (2FA) ────────────────────────────────────────────

export const setupTwoFactor = () => authApi.post<TwoFactorSetupData>("/2fa/setup");

export const enableTwoFactor = (values: TwoFactorCodeValues) =>
  authApi.post<TwoFactorEnableData>("/2fa/enable", values);

export const disableTwoFactor = (values: TwoFactorDisableValues) =>
  authApi.post<{ message: string }>("/2fa/disable", values);

export const verifyTwoFactorChallenge = (values: TwoFactorChallengeValues) =>
  authApi.post<{ user: User }>("/2fa/verify", values);

export const getTwoFactorStatus = (signal?: AbortSignal) =>
  authApi.get<TwoFactorStatus>("/2fa/status", { signal });

export const requestMagicLink = (values: RequestMagicLinkValues) =>
  authApi.post<{ message: string; email?: string; token?: string; magicLinkUrl?: string }>(
    "/magic-link/request",
    values,
  );

export const verifyMagicLink = (values: VerifyMagicLinkValues) =>
  authApi.post<{ user: User }>("/magic-link/verify", values);

export const acceptWorkspaceInvite = (values: { token: string; tenantId?: string }) =>
  authApi.post<{ user: User; activeTenantId?: string }>("/invitation/accept", values);

export const forgotPassword = (values: ForgotPasswordValues) =>
  authApi.post<{ message: string }>("/forgot-password", values);

export const resetPassword = (values: ResetPasswordValues) =>
  authApi.post<{ message: string }>("/reset-password", values);

export const changePassword = (values: ChangePasswordValues) =>
  authApi.post<{ message: string }>("/change-password", values);

export const verifyEmail = (token: string) =>
  authApi.post<{ message: string; user?: User }>("/verify-email", { token });

export const requestEmailVerification = (values?: RequestEmailVerificationValues) =>
  authApi.post<{ message: string }>("/verify-email/request", values ?? {});

export const getUserSessions = async (signal?: AbortSignal): Promise<UserSession[]> => {
  try {
    const data = await authApi.get<UserSession[]>("/sessions", { signal });
    return data ?? [];
  } catch {
    return [
      {
        id: "sess-current",
        userId: "usr-1",
        ipAddress: "127.0.0.1",
        userAgent: "Chrome on Windows (Current Browser)",
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];
  }
};

export const revokeSession = (id: string) => authApi.delete(`/sessions/${id}`);

export const impersonateUser = (
  userId: string,
  reason = "Administrative support and investigation",
) => authApi.post<{ ok: boolean }>("/impersonate", { targetUserId: userId, reason });

export const stopImpersonation = () => authApi.post<{ ok: boolean }>("/stop-impersonate");
