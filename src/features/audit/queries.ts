import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import { auditKeys } from "./keys";
import type { UpdateTenantAuditPolicyInput } from "./schemas";
import type { AuditLogsFilter } from "./types";

export function useTenantAuditLogs(tenantId?: string | null, filters?: AuditLogsFilter) {
  return useQuery({
    queryKey: tenantId ? auditKeys.logs(tenantId, filters) : ["audit", "logs", "disabled"],
    queryFn: ({ signal }) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.getTenantAuditLogs(tenantId, filters, signal);
    },
    enabled: Boolean(tenantId),
  });
}

export function useTenantAuditPolicy(tenantId?: string | null) {
  return useQuery({
    queryKey: tenantId ? auditKeys.policy(tenantId) : ["audit", "policy", "disabled"],
    queryFn: ({ signal }) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.getTenantAuditPolicy(tenantId, signal);
    },
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantAuditPolicy(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTenantAuditPolicyInput) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.updateTenantAuditPolicy(tenantId, input);
    },
    onSuccess: (data) => {
      if (tenantId) {
        queryClient.setQueryData(auditKeys.policy(tenantId), data);
        queryClient.invalidateQueries({ queryKey: auditKeys.policy(tenantId) });
      }
    },
  });
}
