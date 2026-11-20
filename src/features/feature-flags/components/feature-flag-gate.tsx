"use client";

import type { ReactNode } from "react";

import { useActiveTenant } from "@/features/tenants";

import { useFeatureFlag } from "../queries";

interface FeatureFlagGateProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureFlagGate({ flag, fallback = null, children }: FeatureFlagGateProps) {
  const { activeTenant } = useActiveTenant();
  const { value, isLoading } = useFeatureFlag(flag, false, activeTenant?.id);

  if (isLoading) {
    return null;
  }

  if (!value) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
