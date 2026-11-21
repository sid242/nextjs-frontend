"use client";

import { useState } from "react";
import {
  Activity,
  HardDrive,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveTenant } from "@/features/tenants";
import { formatBytes } from "@/lib/format";

import { useAnalyticsOverview } from "../queries";

export function AnalyticsKpiCards() {
  const { activeTenantId } = useActiveTenant();
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data: overview, isLoading, error } = useAnalyticsOverview(activeTenantId, range);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !overview) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm font-medium">
            Failed to load analytics overview. Please check your permissions or try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { activeMembers, storage, securityPosture, inviteConversion, roleDistribution } = overview;

  return (
    <div className="space-y-6">
      {/* Range Filter Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Workspace Metrics</h3>
          <p className="text-muted-foreground text-xs">
            Aggregated metrics for the past{" "}
            {range === "7d" ? "7 days" : range === "90d" ? "90 days" : "30 days"}
          </p>
        </div>
        <div className="w-36">
          <Select value={range} onValueChange={(val) => setRange(val as "7d" | "30d" | "90d")}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d" className="text-xs">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="text-xs">
                Last 30 Days
              </SelectItem>
              <SelectItem value="90d" className="text-xs">
                Last 90 Days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Members */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Active Members
              </CardDescription>
              <Users className="text-primary h-4 w-4" />
            </div>
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold">
              <span>{activeMembers?.mau ?? 0}</span>
              <span className="text-muted-foreground text-xs font-normal">MAU (30d)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">DAU (24h):</span>
              <span className="font-semibold">{activeMembers?.dau ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">WAU (7d):</span>
              <span className="font-semibold">{activeMembers?.wau ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Storage */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Storage Used
              </CardDescription>
              <HardDrive className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold">
              <span>{formatBytes(storage?.totalBytes ?? 0)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Files:</span>
              <span className="font-semibold">{storage?.fileCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Top Format:</span>
              <span className="max-w-[120px] truncate font-mono text-[11px]">
                {storage?.topFileTypes?.[0]?.contentType ?? "None"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security Posture */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Security Posture
              </CardDescription>
              {securityPosture?.mfaAdoptionPercent >= 70 ? (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold">
              <span>{securityPosture?.mfaAdoptionPercent ?? 0}%</span>
              <span className="text-muted-foreground text-xs font-normal">MFA Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            <Progress value={securityPosture?.mfaAdoptionPercent ?? 0} className="h-1.5" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SSO Configured:</span>
              <Badge
                variant={securityPosture?.ssoEnabled ? "default" : "outline"}
                className="h-4 py-0 text-[10px]"
              >
                {securityPosture?.ssoEnabled ? "Enabled" : "Off"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Invite Conversion */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium tracking-wider uppercase">
                Invite Conversion
              </CardDescription>
              <UserCheck className="h-4 w-4 text-purple-500" />
            </div>
            <CardTitle className="flex items-baseline gap-2 text-2xl font-bold">
              <span>{inviteConversion?.acceptanceRatePercent ?? 0}%</span>
              <span className="text-muted-foreground text-xs font-normal">Accepted</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sent:</span>
              <span className="font-semibold">{inviteConversion?.totalInvitesSent ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Joined:</span>
              <span className="font-semibold">{inviteConversion?.acceptedInvites ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown & Security Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="text-primary size-4" /> Member Roles Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Assigned memberships across custom and default workspace roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roleDistribution?.length === 0 ? (
              <p className="text-muted-foreground text-xs">No role distributions available.</p>
            ) : (
              <div className="space-y-2.5">
                {roleDistribution?.map((role) => (
                  <div key={role.roleName} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{role.roleName}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {role.count} member{role.count === 1 ? "" : "s"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-emerald-500" /> Account Health & Hygiene
            </CardTitle>
            <CardDescription className="text-xs">
              Authentication and security risk indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">MFA Enrolled:</span>
              <span className="text-foreground font-semibold">
                {securityPosture?.mfaEnabledMembers ?? 0} of {securityPosture?.totalMembers ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Stale Accounts (&gt;90d inactive):</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {securityPosture?.staleAccountsCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Enterprise SAML/OIDC:</span>
              <span className="text-foreground font-semibold">
                {securityPosture?.ssoEnabled ? "Active & Enforced" : "Not configured"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
