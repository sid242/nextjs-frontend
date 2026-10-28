"use client";

import type { User } from "@/lib/api/types";
import { useAppMutation, type MutationOverrides } from "@/lib/query/hooks";

import { updateMe } from "./api";
import type { ProfileValues } from "./schemas";

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
