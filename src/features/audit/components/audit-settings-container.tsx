"use client";

import * as React from "react";

import { useTenantSubscription } from "@/features/plans";
import { useActiveTenant } from "@/features/tenants";

import { AuditLogsTable } from "./audit-logs-table";
import { AuditRetentionCard } from "./audit-retention-card";

export function AuditSettingsContainer() {
  const { activeTenant } = useActiveTenant();
  const { data: subscription } = useTenantSubscription();

  if (!activeTenant?.id) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        Select a workspace to view audit logs and retention settings.
      </div>
    );
  }

  // Check whether export is permitted on this subscription
  const planName =
    subscription?.plan?.name?.toUpperCase?.() ?? activeTenant.plan?.toUpperCase?.() ?? "FREE";
  const isExportAllowed = planName !== "FREE";

  return (
    <div className="space-y-6">
      <AuditRetentionCard tenantId={activeTenant.id} />
      <AuditLogsTable tenantId={activeTenant.id} isExportAllowed={isExportAllowed} />
    </div>
  );
}
