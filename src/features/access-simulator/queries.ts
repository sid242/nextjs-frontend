import { useMutation, useQuery } from "@tanstack/react-query";

import * as api from "./api";
import { accessSimulatorKeys } from "./keys";
import type { SimulateAccessInput } from "./types";

export function useEffectiveAccess(tenantId?: string | null, userId?: string | null) {
  return useQuery({
    queryKey:
      tenantId && userId
        ? accessSimulatorKeys.effective(tenantId, userId)
        : ["access-simulator", "effective", "disabled"],
    queryFn: ({ signal }) => {
      if (!tenantId || !userId) throw new Error("Tenant ID and User ID required");
      return api.getEffectiveAccess(tenantId, userId, signal);
    },
    enabled: Boolean(tenantId && userId),
  });
}

export function useSimulateAccess(tenantId?: string | null) {
  return useMutation({
    mutationFn: (input: SimulateAccessInput) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.simulateAccess(tenantId, input);
    },
  });
}
