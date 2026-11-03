import { FolderCheck, Folders, Lock, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface GroupStatsCardsProps {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  scope: "TENANT" | "PLATFORM";
}

export function GroupStatsCards({
  totalGroups,
  activeGroups,
  totalMembers,
  scope,
}: GroupStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="font-mono text-xs uppercase">Total Groups</CardDescription>
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Folders className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGroups ?? 0}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            {activeGroups ?? 0} active, {Math.max(0, (totalGroups ?? 0) - (activeGroups ?? 0))}{" "}
            archived
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="font-mono text-xs text-emerald-600 uppercase dark:text-emerald-400">
            Active Groups
          </CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FolderCheck className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeGroups ?? 0}</div>
          <p className="text-muted-foreground mt-1 text-xs">Available for assignment</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="font-mono text-xs text-blue-600 uppercase dark:text-blue-400">
            Assigned Members
          </CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers ?? 0}</div>
          <p className="text-muted-foreground mt-1 text-xs">Total group memberships</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="font-mono text-xs text-amber-600 uppercase dark:text-amber-400">
            Scope & Governance
          </CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lock className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {scope === "PLATFORM" ? "Platform Staff" : "Tenant Scoped"}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {scope === "PLATFORM"
              ? "Internal operator isolation"
              : "Cross-tenant isolation enforced"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
