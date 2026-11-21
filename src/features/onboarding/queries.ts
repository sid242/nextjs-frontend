"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import type { UpdateStepProgressInput } from "./types";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  overview: (tenantId: string) => [...onboardingKeys.all, "overview", tenantId] as const,
};

export function useOnboardingOverview(tenantId?: string | null) {
  return useQuery({
    queryKey: onboardingKeys.overview(tenantId ?? ""),
    queryFn: () =>
      tenantId ? api.getOnboardingOverview(tenantId) : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useUpdateStepProgress(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepKey, input }: { stepKey: string; input: UpdateStepProgressInput }) => {
      if (!tenantId) throw new Error("Missing active tenant");
      return api.updateStepProgress(tenantId, stepKey, input);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview(tenantId) });
    },
  });
}

export function useSkipStep(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stepKey: string) => {
      if (!tenantId) throw new Error("Missing active tenant");
      return api.skipStep(tenantId, stepKey);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: onboardingKeys.overview(tenantId) });
    },
  });
}
