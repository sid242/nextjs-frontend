import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeTenantSubscription,
  createPlan,
  getPlatformPlans,
  getPublicPlans,
  getTenantSubscription,
  updatePlan,
} from "./api";
import { planKeys } from "./keys";
import type { ChangeSubscriptionInput, CreatePlanInput } from "./schemas";

export const publicPlansQueryOptions = () =>
  queryOptions({
    queryKey: planKeys.public(),
    queryFn: ({ signal }) => getPublicPlans(signal),
    staleTime: 5 * 60 * 1000,
  });

export function usePublicPlans() {
  return useQuery(publicPlansQueryOptions());
}

export const platformPlansQueryOptions = (params?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: planKeys.platform(params),
    queryFn: ({ signal }) => getPlatformPlans(params, signal),
  });

export function usePlatformPlans(params?: { includeInactive?: boolean }) {
  return useQuery(platformPlansQueryOptions(params));
}

export const tenantSubscriptionQueryOptions = () =>
  queryOptions({
    queryKey: planKeys.subscription(),
    queryFn: ({ signal }) => getTenantSubscription(signal),
  });

export function useTenantSubscription() {
  return useQuery(tenantSubscriptionQueryOptions());
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePlanInput> }) =>
      updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useChangeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeSubscriptionInput) => changeTenantSubscription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
