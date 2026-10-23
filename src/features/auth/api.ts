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
  UserSession,
  VerifyMagicLinkValues,
} from "./schemas";

// These hit our own Next.js BFF routes (/api/auth/*), which keep tokens in httpOnly cookies.
export const login = (values: LoginValues) => authApi.post<{ user: User }>("/login", values);
export const register = (values: RegisterValues) =>
  authApi.post<{ user: User }>("/register", values);
export const logout = () => authApi.post("/logout");

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

export const impersonateUser = (userId: string) =>
  authApi.post<{ ok: boolean }>("/impersonate", { userId });

export const stopImpersonation = () => authApi.post<{ ok: boolean }>("/stop-impersonate");
