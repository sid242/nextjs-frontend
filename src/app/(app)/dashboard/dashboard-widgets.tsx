"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CreditCard,
  FileUp,
  Palette,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantSubscription } from "@/features/plans";
import { useActiveTenant, useTenantMembers } from "@/features/tenants";

export function DashboardWidgets() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: subscription, isLoading: isSubLoading } = useTenantSubscription();
  const { data: members = [], isLoading: isMembersLoading } = useTenantMembers(activeTenantId);

  const activeMembersCount = (members ?? []).filter((m) => m?.status === "ACTIVE").length;
  const pendingMembersCount = (members ?? []).filter((m) => m?.status === "INVITED").length;
  const maxSeats = subscription?.usage?.maxMembers ?? 5;
  const seatPercentage = Math.min(
    100,
    Math.round((activeMembersCount / Math.max(1, maxSeats)) * 100),
  );

  return (
    <>
      {/* Team Summary Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Team Capacity
            </CardDescription>
            <Users className="text-muted-foreground h-4 w-4" />
          </div>
          <CardTitle className="flex items-baseline gap-2 text-3xl font-bold">
            {isMembersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <span>{activeMembersCount}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  / {maxSeats} seats used
                </span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          <Progress value={seatPercentage} className="h-1.5" />
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              {pendingMembersCount > 0 ? (
                <>
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {pendingMembersCount} pending invite{pendingMembersCount === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span>All invites accepted</span>
              )}
            </span>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-medium">
              <Link href="/team" className="inline-flex items-center gap-1">
                Manage Team <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Plan Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium tracking-wider uppercase">
              Subscription Tier
            </CardDescription>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            {isSubLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <span>{subscription?.plan?.name ?? activeTenant?.plan ?? "Free Tier"}</span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 font-mono text-[10px] text-emerald-500"
                >
                  {subscription?.status ?? "ACTIVE"}
                </Badge>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              {subscription?.plan?.priceCents === 0
                ? "No billing charge"
                : `$${((subscription?.plan?.priceCents ?? 0) / 100).toFixed(0)} / ${subscription?.plan?.billingInterval?.toLowerCase() ?? "month"}`}
            </span>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-medium">
              <Link href="/settings/billing" className="inline-flex items-center gap-1">
                Upgrade / Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {subscription?.plan?.entitlements?.hasCustomRoles ? (
              <Badge variant="secondary" className="text-[10px]">
                Custom RBAC
              </Badge>
            ) : null}
            {subscription?.plan?.entitlements?.hasAdvancedAnalytics ? (
              <Badge variant="secondary" className="text-[10px]">
                Analytics
              </Badge>
            ) : null}
            {subscription?.plan?.entitlements?.hasPrioritySupport ? (
              <Badge variant="secondary" className="text-[10px]">
                24/7 SLA
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function DashboardQuickActions() {
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="text-primary h-4 w-4" /> Quick Actions
        </CardTitle>
        <CardDescription className="text-xs">
          Common workflows and shortcut destinations for your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hover:bg-accent/40 h-auto flex-col items-start gap-1 p-3 text-left"
          >
            <Link href="/team">
              <UserPlus className="text-primary h-4 w-4" />
              <div className="text-xs font-semibold">Invite Member</div>
              <div className="text-muted-foreground text-[10px] font-normal">Add collaborators</div>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="hover:bg-accent/40 h-auto flex-col items-start gap-1 p-3 text-left"
          >
            <Link href="/files">
              <FileUp className="h-4 w-4 text-blue-500" />
              <div className="text-xs font-semibold">Upload Files</div>
              <div className="text-muted-foreground text-[10px] font-normal">Cloud storage</div>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="hover:bg-accent/40 h-auto flex-col items-start gap-1 p-3 text-left"
          >
            <Link href="/settings/branding">
              <Palette className="h-4 w-4 text-purple-500" />
              <div className="text-xs font-semibold">Workspace Branding</div>
              <div className="text-muted-foreground text-[10px] font-normal">Logo & theme</div>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="hover:bg-accent/40 h-auto flex-col items-start gap-1 p-3 text-left"
          >
            <Link href="/audit-logs">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <div className="text-xs font-semibold">Audit Trail</div>
              <div className="text-muted-foreground text-[10px] font-normal">Security activity</div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
