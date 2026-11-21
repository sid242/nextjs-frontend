import { authApi } from "@/lib/api/http";
import type { User } from "@/lib/api/types";
import type { UserMembershipSummary } from "@/lib/tenancy/after-login";

import type {
  ChangePasswordValues,
  ForgotPasswordValues,
  LoginValues,
  RegenerateRecoveryCodesData,
  RegenerateRecoveryCodesValues,
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
  UserLoginEvent,
  UserSession,
  VerifyMagicLinkValues,
} from "./schemas";

export type LoginResult =
  | { user: User; memberships?: UserMembershipSummary[]; twoFactorRequired?: false }
  | {
      user?: never;
      memberships?: never;
      twoFactorRequired: true;
      challengeToken: string;
      method: "totp";
    };

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
  authApi.post<{ user: User; memberships?: UserMembershipSummary[] }>("/2fa/verify", values);

export const getTwoFactorStatus = (signal?: AbortSignal) =>
  authApi.get<TwoFactorStatus>("/2fa/status", { signal });

export const requestMagicLink = (values: RequestMagicLinkValues) =>
  authApi.post<{ message: string; email?: string; token?: string; magicLinkUrl?: string }>(
    "/magic-link/request",
    values,
  );

export const verifyMagicLink = (values: VerifyMagicLinkValues) =>
  authApi.post<{ user: User }>("/magic-link/verify", values);

export interface InvitationPreview {
  email: string;
  firstName?: string;
  lastName?: string;
  tenantName: string;
  tenantSlug?: string;
  roleName: string;
  expiresAt: string;
  hasAccount: boolean;
}

export interface AcceptWorkspaceInviteValues {
  token: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

export const previewWorkspaceInvite = (token: string) =>
  authApi.get<InvitationPreview>(`/invitation/preview?token=${encodeURIComponent(token)}`);

export const acceptWorkspaceInvite = (values: AcceptWorkspaceInviteValues) =>
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
    return [];
  }
};

export const revokeSession = (id: string) => authApi.delete(`/sessions/${id}`);

export const revokeOtherSessions = (currentSessionId?: string) =>
  authApi.post<{ count: number; message: string }>("/sessions/revoke-others", { currentSessionId });

export const regenerateRecoveryCodes = (values: RegenerateRecoveryCodesValues) =>
  authApi.post<RegenerateRecoveryCodesData>("/2fa/recovery-codes/regenerate", values);

export const getLoginHistory = (page = 1, limit = 10, signal?: AbortSignal) =>
  authApi.get<{
    items: UserLoginEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/login-history?page=${page}&limit=${limit}`, { signal });

export const impersonateUser = (
  userId: string,
  reason = "Administrative support and investigation",
) => authApi.post<{ ok: boolean }>("/impersonate", { targetUserId: userId, reason });

export const stopImpersonation = () => authApi.post<{ ok: boolean }>("/stop-impersonate");
