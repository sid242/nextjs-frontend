"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import type { CreateReportDefinitionInput, ReportDefinition, ReportRun } from "./types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (tenantId: string, range?: string) =>
    [...analyticsKeys.all, "overview", tenantId, range ?? "30d"] as const,
  usage: (tenantId: string, params?: { from?: string; to?: string; meter?: string }) =>
    [...analyticsKeys.all, "usage", tenantId, params] as const,
  activity: (tenantId: string, params?: { limit?: number; cursor?: string; entityType?: string }) =>
    [...analyticsKeys.all, "activity", tenantId, params] as const,
  reportDefinitions: (tenantId: string) =>
    [...analyticsKeys.all, "reports", "definitions", tenantId] as const,
  reportRuns: (tenantId: string, definitionId?: string) =>
    [...analyticsKeys.all, "reports", "runs", tenantId, definitionId ?? "all"] as const,
  platformMetrics: () => ["platform", "metrics", "overview"] as const,
};

export function useAnalyticsOverview(
  tenantId?: string | null,
  range: "7d" | "30d" | "90d" = "30d",
) {
  return useQuery({
    queryKey: analyticsKeys.overview(tenantId ?? "", range),
    queryFn: () =>
      tenantId
        ? api.getAnalyticsOverview(tenantId, range)
        : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useTenantUsage(
  tenantId?: string | null,
  params?: { from?: string; to?: string; meter?: string },
) {
  return useQuery({
    queryKey: analyticsKeys.usage(tenantId ?? "", params),
    queryFn: () =>
      tenantId ? api.getTenantUsage(tenantId, params) : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useActivityFeed(
  tenantId?: string | null,
  params?: { limit?: number; cursor?: string; entityType?: string },
) {
  return useQuery({
    queryKey: analyticsKeys.activity(tenantId ?? "", params),
    queryFn: () =>
      tenantId ? api.getActivityFeed(tenantId, params) : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useReportDefinitions(tenantId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.reportDefinitions(tenantId ?? ""),
    queryFn: () =>
      tenantId ? api.listReportDefinitions(tenantId) : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useCreateReportDefinition(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReportDefinitionInput) => {
      if (!tenantId) throw new Error("Missing active tenant");
      return api.createReportDefinition(tenantId, input);
    },
    onSuccess: (newDefinition: ReportDefinition) => {
      if (!tenantId) return;
      queryClient.setQueryData<ReportDefinition[]>(
        analyticsKeys.reportDefinitions(tenantId),
        (old) => (old ? [newDefinition, ...old] : [newDefinition]),
      );
    },
  });
}

export function useTriggerReportRun(tenantId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (definitionId: string) => {
      if (!tenantId) throw new Error("Missing active tenant");
      return api.triggerReportRun(tenantId, definitionId);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.reportRuns(tenantId),
      });
    },
  });
}

export function useReportRuns(tenantId?: string | null, definitionId?: string) {
  return useQuery({
    queryKey: analyticsKeys.reportRuns(tenantId ?? "", definitionId),
    queryFn: () =>
      tenantId
        ? api.listReportRuns(tenantId, definitionId)
        : Promise.reject(new Error("No tenantId")),
    enabled: Boolean(tenantId),
    refetchInterval: 5000, // poll status changes while viewing runs
  });
}

export function usePlatformMetrics() {
  return useQuery({
    queryKey: analyticsKeys.platformMetrics(),
    queryFn: () => api.getPlatformMetricsOverview(),
    staleTime: 5 * 60 * 1000,
  });
}
