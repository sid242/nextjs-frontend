import { api } from "@/lib/api/http";

import type { EffectiveAccessResult, SimulateAccessInput, SimulationResult } from "./types";

export async function getEffectiveAccess(
  tenantId: string,
  userId: string,
  signal?: AbortSignal,
): Promise<EffectiveAccessResult> {
  return api.get<EffectiveAccessResult>(`/tenants/${tenantId}/access/effective/${userId}`, {
    signal,
  });
}

export async function simulateAccess(
  tenantId: string,
  input: SimulateAccessInput,
): Promise<SimulationResult> {
  return api.post<SimulationResult>(`/tenants/${tenantId}/access/simulate`, input);
}
