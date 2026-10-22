import { ShieldIcon, UserCheckIcon, UsersIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface TeamStatsCardsProps {
  totalMembers: number;
  activeMembers: number;
}

export function TeamStatsCards({ totalMembers, activeMembers }: TeamStatsCardsProps) {
  const pendingOrInvited = Math.max(0, (totalMembers ?? 0) - (activeMembers ?? 0));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">Total Members</CardDescription>
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <UsersIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers ?? 0}</div>
          <p className="text-muted-foreground mt-1 text-xs">Assigned to active workspace</p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">Active Status</CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <UserCheckIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeMembers ?? 0} Active</div>
          <p className="text-muted-foreground mt-1 text-xs">
            {pendingOrInvited} pending or invited
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">RBAC Security</CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <ShieldIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Dynamic RBAC</div>
          <p className="text-muted-foreground mt-1 text-xs">Role-scoped token validation</p>
        </CardContent>
      </Card>
    </div>
  );
}
