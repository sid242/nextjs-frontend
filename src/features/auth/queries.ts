"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changePassword,
  getUserSessions,
  requestEmailVerification,
  revokeSession,
  stopImpersonation,
  verifyEmail,
} from "./api";
import { authKeys } from "./keys";
import type { ChangePasswordValues, RequestEmailVerificationValues, UserSession } from "./schemas";

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
