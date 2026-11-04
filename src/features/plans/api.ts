import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type {
  AssignSubscriptionInput,
  ChangeSubscriptionInput,
  CreatePlanInput,
  EntitlementDefinition,
  Plan,
  PlanFilters,
  PlatformSubscriptionsResponse,
  SubscriptionFilters,
  TenantEntitlementOverrideInput,
  TenantEntitlementOverrideResult,
  TenantSubscription,
  UpdatePlanInput,
} from "./schemas";

export async function getPublicPlans(signal?: AbortSignal): Promise<Plan[]> {
  return api.get<Plan[]>("/plans", { signal });
}

export async function getPlatformPlans(
  params?: Partial<PlanFilters> & { includeInactive?: boolean },
  signal?: AbortSignal,
): Promise<Plan[]> {
  const qs = buildQueryString(
    {
      includeInactive: params?.includeInactive ? true : undefined,
      search: params?.search,
      status: params?.status,
      billingInterval: params?.billingInterval,
      currency: params?.currency,
      entitlement: params?.entitlement,
      minPriceMinor: params?.minPrice,
      maxPriceMinor: params?.maxPrice,
    },
    ["minPriceMinor"],
  );
  return api.get<Plan[]>(`/plans/platform${qs}`, { signal });
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  return api.post<Plan>("/plans/platform", input);
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
  return api.patch<Plan>(`/plans/platform/${id}`, input);
}

export async function getTenantSubscription(signal?: AbortSignal): Promise<TenantSubscription> {
  return api.get<TenantSubscription>("/plans/subscription", { signal });
}

export async function changeTenantSubscription(
  input: ChangeSubscriptionInput,
): Promise<TenantSubscription> {
  return api.post<TenantSubscription>("/plans/subscription/change", input);
}

export async function assignPlatformSubscription(
  input: AssignSubscriptionInput,
): Promise<TenantSubscription> {
  return api.post<TenantSubscription>("/plans/platform/subscriptions/assign", input);
}

export async function getPlatformSubscriptions(
  params?: SubscriptionFilters,
  signal?: AbortSignal,
): Promise<PlatformSubscriptionsResponse> {
  const qs = buildQueryString({
    search: params?.search,
    status: params?.status,
    billingInterval: params?.billingInterval,
    provider: params?.provider,
    planKey: params?.planKey,
  });
  return api.get<PlatformSubscriptionsResponse>(`/plans/platform/subscriptions${qs}`, { signal });
}

export async function setTenantEntitlementOverride(
  tenantId: string,
  input: TenantEntitlementOverrideInput,
): Promise<TenantEntitlementOverrideResult> {
  return api.post<TenantEntitlementOverrideResult>(
    `/plans/platform/tenants/${tenantId}/entitlements/override`,
    input,
  );
}

export async function removeTenantEntitlementOverride(
  tenantId: string,
  key: string,
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(
    `/plans/platform/tenants/${tenantId}/entitlements/override/${key}`,
  );
}

export async function getEntitlementDefinitions(
  signal?: AbortSignal,
): Promise<EntitlementDefinition[]> {
  return api.get<EntitlementDefinition[]>("/plans/platform/entitlements", { signal });
}
