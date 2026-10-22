import { api } from "@/lib/api/http";

import type { ChangeSubscriptionInput, CreatePlanInput, Plan, TenantSubscription } from "./schemas";

export async function getPublicPlans(signal?: AbortSignal): Promise<Plan[]> {
  return api.get<Plan[]>("/plans", { signal });
}

export async function getPlatformPlans(
  params?: { includeInactive?: boolean },
  signal?: AbortSignal,
): Promise<Plan[]> {
  const query = new URLSearchParams();
  if (params?.includeInactive) query.set("includeInactive", "true");
  const qs = query.toString();
  return api.get<Plan[]>(`/plans/platform${qs ? `?${qs}` : ""}`, { signal });
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  return api.post<Plan>("/plans/platform", input);
}

export async function updatePlan(id: string, input: Partial<CreatePlanInput>): Promise<Plan> {
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
