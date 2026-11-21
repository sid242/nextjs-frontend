"use client";

import { Building2, HardDrive, Layers, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatDateTime } from "@/lib/format";

import { usePlatformMetrics } from "../queries";

export function PlatformMetricsDashboard() {
  const { data: metrics, isLoading, error } = usePlatformMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm font-medium">
            Failed to load platform executive metrics. Ensure you have platform_metrics:read
            permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { kpis, updatedAt } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Platform Executive KPIs</h2>
          <p className="text-muted-foreground text-xs">
            Global metrics across all hosted customer tenant organizations.
          </p>
        </div>
        <span className="text-muted-foreground text-[11px]">
          Snapshot updated: {formatDateTime(updatedAt)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Tenants
              </CardDescription>
              <Building2 className="text-primary size-4" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpis?.totalTenants ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis?.activeTenants ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspended:</span>
              <span className="text-destructive font-semibold">{kpis?.suspendedTenants ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Registered Users
              </CardDescription>
              <Users className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpis?.totalUsers ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs">
            <span className="text-muted-foreground">Across all organizations</span>
          </CardContent>
        </Card>

        {/* Global Storage */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Global S3 Storage
              </CardDescription>
              <HardDrive className="size-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {formatBytes(kpis?.totalStorageBytes ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs">
            <span className="text-muted-foreground">Multi-tenant S3 bucket</span>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Active Tiers
              </CardDescription>
              <Layers className="size-4 text-purple-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {kpis?.planDistribution?.length ?? 0} Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-1 text-xs">
            <div className="flex flex-wrap gap-1">
              {kpis?.planDistribution?.slice(0, 3).map((p) => (
                <Badge key={p.plan} variant="secondary" className="text-[10px]">
                  {p.plan}: {p.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="text-primary size-4" /> Tenant Plan Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of active workspaces across commercial plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis?.planDistribution?.map((p) => (
              <div
                key={p.plan}
                className="border-border/60 bg-muted/20 flex flex-col justify-between rounded-lg border p-3"
              >
                <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  {p.plan}
                </span>
                <span className="text-foreground mt-2 text-2xl font-bold">{p.count}</span>
                <span className="text-muted-foreground text-[11px]">Tenants</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
