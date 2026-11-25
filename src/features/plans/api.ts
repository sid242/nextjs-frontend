import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import {
  catalogPlanSchema,
  tenantBillingOverviewSchema,
  type AssignSubscriptionInput,
  type ChangeSubscriptionInput,
  type CreatePlanInput,
  type EntitlementDefinition,
  type Plan,
  type PlanFilters,
  type PlatformSubscriptionsResponse,
  type SubscriptionFilters,
  type TenantEntitlementOverrideInput,
  type TenantEntitlementOverrideResult,
  type TenantSubscription,
  type UpdatePlanInput,
} from "./schemas";

export async function getPublicPlans(signal?: AbortSignal): Promise<Plan[]> {
  const plans = await api.get<unknown>("/plans", { signal });
  return catalogPlanSchema.array().parse(plans);
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
  const plans = await api.get<unknown>(`/billing/platform/plans${qs}`, { signal });
  return catalogPlanSchema.array().parse(plans);
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const { priceCents, currency, entitlements, ...rest } = input;
  const pricePayload =
    input.billingInterval === "ANNUAL"
      ? { priceMonthlyMinor: 0, priceYearlyMinor: priceCents }
      : { priceMonthlyMinor: priceCents, priceYearlyMinor: priceCents * 10 };
  const limits = {
    maxMembers: entitlements?.maxMembers ?? null,
    maxStorageBytes: entitlements?.maxStorageMb ? entitlements.maxStorageMb * 1024 * 1024 : null,
    maxCustomRoles: entitlements?.hasCustomRoles ? null : 0,
    urlAccess: { path: true as const, subdomain: true, customDomain: false },
  };
  return api.post<Plan>("/billing/platform/plans", {
    ...rest,
    ...pricePayload,
    currency: currency.trim().toUpperCase(),
    limits,
    entitlements,
  });
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
  const { priceCents, currency, ...rest } = input;
  const pricePayload =
    input.billingInterval === "ANNUAL"
      ? { priceYearlyMinor: priceCents }
      : { priceMonthlyMinor: priceCents };
  return api.patch<Plan>(`/billing/platform/plans/${id}`, {
    ...rest,
    ...pricePayload,
    currency: currency.trim().toUpperCase(),
  });
}

export async function getTenantSubscription(
  signal?: AbortSignal,
): Promise<TenantSubscription | null> {
  const overview = await api.get<unknown>("/plans/subscription", { signal });
  return tenantBillingOverviewSchema.parse(overview);
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
