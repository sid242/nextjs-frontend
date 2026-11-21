import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filesKeys, FilesSummary, RecentFilesCard } from "@/features/files";
import { OnboardingChecklistCard } from "@/features/onboarding";
import type { FileRecord } from "@/lib/api/types";
import { getAccessToken, requireUser } from "@/lib/auth/session";
import { getServerQueryClient } from "@/lib/query/server";
import { backendFetch } from "@/lib/server/backend";

import { DashboardQuickActions, DashboardWidgets } from "./dashboard-widgets";

export const metadata: Metadata = { title: "Dashboard" };

async function prefetchFiles(queryClient: ReturnType<typeof getServerQueryClient>): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: filesKeys.list(),
    queryFn: async () => {
      const res = await backendFetch("/files", { token });
      if (!res.ok) throw new Error(`Prefetch /files failed (${res.status})`);
      const body = (await res.json()) as { data?: FileRecord[] } | FileRecord[];
      return (Array.isArray(body) ? body : (body?.data ?? [])) as FileRecord[];
    },
  });
}

export default async function DashboardPage() {
  const user = await requireUser(); // deduplicated with the layout's call
  const queryClient = getServerQueryClient();
  await prefetchFiles(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="grid gap-6">
        <PageHeader
          title={`Welcome back, ${user.firstName}`}
          description="Here's a quick overview of your workspace and activity."
        />
        <OnboardingChecklistCard />
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
