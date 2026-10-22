"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  HardDrive,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { useTenantSubscription } from "../queries";
import { ChangePlanDialog } from "./change-plan-dialog";

export function TenantBillingCard() {
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const { data: subscription, isLoading, error } = useTenantSubscription();

  if (isLoading) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive text-base">Subscription Unavailable</CardTitle>
          <CardDescription className="text-xs">
            Unable to load organization billing details. Ensure your tenant organization context is
            active.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const plan = subscription?.plan;
  const usage = subscription?.usage;
  const activeMembers = usage?.activeMembers ?? 1;
  const maxMembers = usage?.maxMembers ?? 5;
  const seatPercentage = Math.min(100, Math.round((activeMembers / maxMembers) * 100));
  const isNearLimit = activeMembers >= maxMembers - 1;
  const isAtLimit = activeMembers >= maxMembers;

  const formattedPrice =
    plan?.priceCents === 0 ? "Free" : `$${((plan?.priceCents ?? 0) / 100).toFixed(0)} / month`;

  return (
    <>
      <Card className="border-border/80 bg-card/40 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Workspace Subscription & Plan
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 font-mono text-[10px] text-emerald-500 uppercase"
                >
                  {subscription?.status ?? "ACTIVE"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Manage your organization&apos;s tier, team seat allocation, and feature
                entitlements.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setChangeDialogOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Upgrade / Switch Plan
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Highlight Banner */}
          <div className="border-border/60 bg-muted/30 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <CreditCard className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold tracking-tight">{plan?.name ?? "Free Tier"}</h4>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {plan?.key ?? "FREE"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {plan?.description ?? "Core collaborative features for early teams."}
                </p>
              </div>
            </div>

            <div className="sm:border-border/60 text-right sm:border-l sm:pl-4">
              <span className="font-mono text-xl font-bold tracking-tight">{formattedPrice}</span>
              <p className="text-muted-foreground text-[11px]">
                Billed {plan?.billingInterval?.toLowerCase() ?? "monthly"}
              </p>
            </div>
          </div>

          {/* Seat Capacity & Limits Meter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Users className="text-foreground h-3.5 w-3.5" />
                Team Seat Utilization
              </span>
              <span className="font-mono font-semibold">
                {activeMembers} / {maxMembers} seats occupied ({seatPercentage}%)
              </span>
            </div>

            <Progress
              value={seatPercentage}
              className={`h-2 ${
                isAtLimit
                  ? "[&>div]:bg-red-500"
                  : isNearLimit
                    ? "[&>div]:bg-amber-500"
                    : "[&>div]:bg-primary"
              }`}
            />

            {isAtLimit ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Maximum seat limit reached. New member invitations are paused until you upgrade
                  your plan.
                </span>
              </div>
            ) : isNearLimit ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Only {maxMembers - activeMembers} seat remaining before plan limit is reached.
                </span>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{usage?.remainingSeats ?? 0} seats available for new team members.</span>
              </div>
            )}
          </div>

          {/* Entitlements Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-border/50 bg-background/50 rounded-lg border p-3">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                <HardDrive className="text-primary h-3.5 w-3.5" />
                Cloud Storage Quota
              </div>
              <div className="font-mono text-base font-bold">
                {((plan?.entitlements?.maxStorageMb ?? 1024) / 1024).toFixed(0)} GB
              </div>
              <p className="text-muted-foreground text-[10px]">Encrypted S3 bucket storage</p>
            </div>

            <div className="border-border/50 bg-background/50 rounded-lg border p-3">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="text-primary h-3.5 w-3.5" />
                RBAC Permissions
              </div>
              <div className="text-sm font-semibold">
                {plan?.entitlements?.hasCustomRoles ? "Custom Roles Enabled" : "Standard Roles"}
              </div>
              <p className="text-muted-foreground text-[10px]">Fine-grained action authorization</p>
            </div>

            <div className="border-border/50 bg-background/50 rounded-lg border p-3">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                <Sparkles className="text-primary h-3.5 w-3.5" />
                Audited SLA & Support
              </div>
              <div className="text-sm font-semibold">
                {plan?.entitlements?.hasPrioritySupport
                  ? "Priority SLA (24/7)"
                  : "Standard Community"}
              </div>
              <p className="text-muted-foreground text-[10px]">
                {plan?.entitlements?.hasAuditRetentionDays ?? 7}-day audit retention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChangePlanDialog
        open={changeDialogOpen}
        onOpenChange={setChangeDialogOpen}
        currentPlanKey={plan?.key}
      />
    </>
  );
}
