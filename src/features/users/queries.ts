"use client";

import { queryOptions, useQueryClient } from "@tanstack/react-query";

import type { User } from "@/lib/api/types";
import {
  useAppMutation,
  useAppQuery,
  type MutationOverrides,
  type QueryOverrides,
} from "@/lib/query/hooks";

import { impersonateUser, listUsers, updateMe, updateUserRole, updateUserStatus } from "./api";
import { userKeys } from "./keys";
import type { AdminUser, ProfileValues } from "./schemas";

export const adminUsersQueryOptions = (page = 1) =>
  queryOptions({
    queryKey: userKeys.adminList(page),
    queryFn: ({ signal }) => listUsers(page, 20, signal),
    staleTime: 60 * 1000,
  });

export function useAdminUsers(page = 1, options?: QueryOverrides<AdminUser[]>) {
  return useAppQuery<AdminUser[]>(adminUsersQueryOptions(page), options);
}

/**
 * Mutation hook to update the authenticated user's profile details.
 */
export function useUpdateProfile(options?: MutationOverrides<User, ProfileValues>) {
  return useAppMutation(
    {
      mutationFn: (values: ProfileValues) => updateMe(values),
      successMessage: "Profile updated successfully",
      errorMessage: "Could not update your profile.",
    },
    options,
  );
}

export function useUpdateUserRole(
  options?: MutationOverrides<void, { userId: string; role: "USER" | "ADMIN" }>,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: ({ userId, role }: { userId: string; role: "USER" | "ADMIN" }) =>
        updateUserRole(userId, role),
      onSuccess: (_: void, { userId, role }: { userId: string; role: "USER" | "ADMIN" }) => {
        queryClient.setQueriesData<AdminUser[]>(
          { queryKey: userKeys.all },
          (old = []) => old?.map((u) => (u?.id === userId ? { ...u, role } : u)) ?? [],
        );
      },
    },
    options,
  );
}

export function useUpdateUserStatus(
  options?: MutationOverrides<
    void,
    {
      userId: string;
      status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
    }
  >,
) {
  const queryClient = useQueryClient();

  return useAppMutation(
    {
      mutationFn: ({
        userId,
        status,
      }: {
        userId: string;
        status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
      }) => updateUserStatus(userId, status),
      onSuccess: (
        _: void,
        {
          userId,
          status,
        }: {
          userId: string;
          status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
        },
      ) => {
        queryClient.setQueriesData<AdminUser[]>(
          { queryKey: userKeys.all },
          (old = []) => old?.map((u) => (u?.id === userId ? { ...u, status } : u)) ?? [],
        );
      },
    },
    options,
  );
}

export function useImpersonateUser(options?: MutationOverrides<void, string>) {
  return useAppMutation(
    {
      mutationFn: (userId: string) => impersonateUser(userId),
      onSuccess: () => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Full page navigation needed to clear application state
        window.location.assign("/dashboard");
      },
    },
    options,
  );
}
