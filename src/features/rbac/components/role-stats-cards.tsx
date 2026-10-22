import { KeyRoundIcon, LockIcon, ShieldCheckIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface RoleStatsCardsProps {
  rolesCount: number;
  customRolesCount: number;
  scopesCount: number;
  modulesCount: number;
}

export function RoleStatsCards({
  rolesCount,
  customRolesCount,
  scopesCount,
  modulesCount,
}: RoleStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">Configured Roles</CardDescription>
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <ShieldCheckIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rolesCount ?? 0} Roles</div>
          <p className="text-muted-foreground mt-1 text-xs">
            {customRolesCount ?? 0} custom workspace roles
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">Available Scopes</CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <KeyRoundIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scopesCount ?? 0} Scopes</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Organized across {modulesCount ?? 0} application modules
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-xs sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-xs font-medium">RBAC Security</CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <LockIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Dynamic RBAC</div>
          <p className="text-muted-foreground mt-1 text-xs">Real-time token scope verification</p>
        </CardContent>
      </Card>
    </div>
  );
}
