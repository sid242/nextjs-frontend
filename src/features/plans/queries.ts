"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignPlatformSubscription,
  changeTenantSubscription,
  createPlan,
  getEntitlementDefinitions,
  getPlatformPlans,
  getPlatformSubscriptions,
  getPublicPlans,
  getTenantSubscription,
  updatePlan,
} from "./api";
import { planKeys } from "./keys";
import type {
  AssignSubscriptionInput,
  ChangeSubscriptionInput,
  CreatePlanInput,
  PlanFilters,
  SubscriptionFilters,
  UpdatePlanInput,
} from "./schemas";

export const publicPlansQueryOptions = () =>
  queryOptions({
    queryKey: planKeys.public(),
    queryFn: ({ signal }) => getPublicPlans(signal),
    staleTime: 5 * 60 * 1000,
  });

export function usePublicPlans() {
  return useQuery(publicPlansQueryOptions());
}

export const platformPlansQueryOptions = (
  params?: Partial<PlanFilters> & { includeInactive?: boolean },
) =>
  queryOptions({
    queryKey: planKeys.platform(params),
    queryFn: ({ signal }) => getPlatformPlans(params, signal),
  });

export function usePlatformPlans(params?: Partial<PlanFilters> & { includeInactive?: boolean }) {
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
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanInput }) => updatePlan(id, data),
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

export function useAssignSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignSubscriptionInput) => assignPlatformSubscription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function usePlatformSubscriptions(params?: SubscriptionFilters) {
  return useQuery({
    queryKey: ["plans", "platform", "subscriptions", params],
    queryFn: ({ signal }) => getPlatformSubscriptions(params, signal),
  });
}

export function useEntitlementDefinitions() {
  return useQuery({
    queryKey: ["plans", "platform", "entitlements"],
    queryFn: ({ signal }) => getEntitlementDefinitions(signal),
    staleTime: 10 * 60 * 1000,
  });
}
