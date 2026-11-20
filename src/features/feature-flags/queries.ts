"use client";

import { useQuery } from "@tanstack/react-query";

import * as api from "./api";

export const featureFlagKeys = {
  all: ["feature-flags"] as const,
  resolve: (tenantId?: string) => [...featureFlagKeys.all, "resolve", tenantId] as const,
  single: (key: string, tenantId?: string) =>
    [...featureFlagKeys.all, "single", key, tenantId] as const,
};

export function useFeatureFlags(tenantId?: string) {
  return useQuery({
    queryKey: featureFlagKeys.resolve(tenantId),
    queryFn: () => api.resolveFeatureFlags(tenantId),
    staleTime: 60 * 1000,
  });
}

export function useFeatureFlag<T = boolean>(
  key: string,
  defaultValue: T = false as unknown as T,
  tenantId?: string,
): { value: T; isLoading: boolean } {
  const { data, isLoading } = useFeatureFlags(tenantId);
  const resolved = data?.[key];

  return {
    value: resolved !== undefined ? (resolved as T) : defaultValue,
    isLoading,
  };
}
