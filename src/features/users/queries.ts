"use client";

import type { User } from "@/lib/api/types";
import { useAppMutation, type MutationOverrides } from "@/lib/query/hooks";

import { updateMe } from "./api";
import { userKeys } from "./keys";
import type { ProfileValues } from "./schemas";

/**
 * Mutation hook to update the authenticated user's profile details.
 */
export function useUpdateProfile(options?: MutationOverrides<User, ProfileValues>) {
  return useAppMutation(
    {
      mutationFn: (values: ProfileValues) => updateMe(values),
      invalidateKeys: [userKeys.me()],
      successMessage: "Profile updated successfully",
      errorMessage: "Could not update your profile.",
    },
    options,
  );
}
