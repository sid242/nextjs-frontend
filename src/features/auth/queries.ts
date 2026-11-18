"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptWorkspaceInvite,
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  getLoginHistory,
  getTwoFactorStatus,
  getUserSessions,
  regenerateRecoveryCodes,
  requestEmailVerification,
  requestMagicLink,
  revokeOtherSessions,
  revokeSession,
  setupTwoFactor,
  stopImpersonation,
  verifyEmail,
  verifyMagicLink,
  verifyTwoFactorChallenge,
} from "./api";
import { authKeys } from "./keys";
import type {
  ChangePasswordValues,
  RegenerateRecoveryCodesValues,
  RequestEmailVerificationValues,
  RequestMagicLinkValues,
  TwoFactorChallengeValues,
  TwoFactorCodeValues,
  TwoFactorDisableValues,
  TwoFactorStatus,
  UserSession,
  VerifyMagicLinkValues,
} from "./schemas";

export const twoFactorStatusQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.twoFactorStatus(),
    queryFn: ({ signal }) => getTwoFactorStatus(signal),
    staleTime: 60 * 1000,
  });

export function useTwoFactorStatus() {
  return useQuery(twoFactorStatusQueryOptions());
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: () => setupTwoFactor(),
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TwoFactorCodeValues) => enableTwoFactor(values),
    onSuccess: () => {
      queryClient.setQueryData<TwoFactorStatus>(authKeys.twoFactorStatus(), {
        enabled: true,
        enabledAt: new Date().toISOString(),
      });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TwoFactorDisableValues) => disableTwoFactor(values),
    onSuccess: () => {
      queryClient.setQueryData<TwoFactorStatus>(authKeys.twoFactorStatus(), {
        enabled: false,
        enabledAt: null,
      });
    },
  });
}

export function useVerifyTwoFactorChallenge() {
  return useMutation({
    mutationFn: (values: TwoFactorChallengeValues) => verifyTwoFactorChallenge(values),
  });
}

export const sessionsQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.sessions(),
    queryFn: ({ signal }) => getUserSessions(signal),
    staleTime: 60 * 1000,
  });

export function useUserSessions() {
  return useQuery(sessionsQueryOptions());
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<UserSession[]>(authKeys.sessions(), (old = []) =>
        old.filter((s) => s.id !== id),
      );
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currentSessionId?: string) => revokeOtherSessions(currentSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RegenerateRecoveryCodesValues) => regenerateRecoveryCodes(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.twoFactorStatus() });
    },
  });
}

export const loginHistoryQueryOptions = (page = 1, limit = 10) =>
  queryOptions({
    queryKey: authKeys.loginHistory(page, limit),
    queryFn: ({ signal }) => getLoginHistory(page, limit, signal),
    staleTime: 30 * 1000,
  });

export function useLoginHistory(page = 1, limit = 10) {
  return useQuery(loginHistoryQueryOptions(page, limit));
}

export function useStopImpersonation() {
  return useMutation({
    mutationFn: () => stopImpersonation(),
    onSuccess: () => {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full page navigation needed to clear application state
      window.location.assign("/dashboard");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: ChangePasswordValues) => changePassword(values),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });
}

export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: (values?: RequestEmailVerificationValues) => requestEmailVerification(values),
  });
}

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (values: RequestMagicLinkValues) => requestMagicLink(values),
  });
}

export function useVerifyMagicLink() {
  return useMutation({
    mutationFn: (values: VerifyMagicLinkValues) => verifyMagicLink(values),
  });
}

export function useAcceptWorkspaceInvite() {
  return useMutation({
    mutationFn: (values: { token: string; tenantId?: string }) => acceptWorkspaceInvite(values),
  });
}
