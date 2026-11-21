"use client";

import { Activity, BarChart3, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/molecules/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeedTimeline, AnalyticsKpiCards, ReportsManager } from "@/features/analytics";
import { TENANT_PERMISSIONS, TenantPermissionGate, useActiveTenant } from "@/features/tenants";

export default function AnalyticsPage() {
  const { activeTenant } = useActiveTenant();

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.ANALYTICS_READ}>
      <div className="grid gap-6">
        <PageHeader
          title="Analytics & Reports"
          description={`Usage metrics, security health, audit activity, and report exports for ${activeTenant?.name ?? "your organization"}.`}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/70 border-border/50 border">
            <TabsTrigger value="overview" className="gap-2 text-xs">
              <BarChart3 className="size-3.5" />
              Overview & Metrics
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 text-xs">
              <Activity className="size-3.5" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 text-xs">
              <FileSpreadsheet className="size-3.5" />
              Reports & Exports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 outline-none">
            <AnalyticsKpiCards />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 outline-none">
            <ActivityFeedTimeline />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 outline-none">
            <ReportsManager />
          </TabsContent>
        </Tabs>
      </div>
    </TenantPermissionGate>
  );
}
