import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilesSummary, prefetchFiles, RecentFilesCard } from "@/features/files";
import { requireUser } from "@/lib/auth/session";
import { getServerQueryClient } from "@/lib/query/server";

import { DashboardQuickActions, DashboardWidgets } from "./dashboard-widgets";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser(); // deduplicated with the layout's call
  const queryClient = getServerQueryClient();
  await prefetchFiles(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="grid gap-6">
        <PageHeader
          title={`Welcome back, ${user.name.split(" ")[0] ?? user.name}`}
          description="Here's a quick overview of your workspace and activity."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilesSummary />
          <DashboardWidgets />
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Account Status
              </CardDescription>
              <CardTitle className="pt-1">
                <Badge variant="secondary" className="font-mono text-xs tracking-wide">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        <DashboardQuickActions />
        <RecentFilesCard />
      </div>
    </HydrationBoundary>
  );
}
