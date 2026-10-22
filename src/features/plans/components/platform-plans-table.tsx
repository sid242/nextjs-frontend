"use client";

import { useState } from "react";
import { CreditCard, HardDrive, Layers, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/errors";

import { usePlatformPlans } from "../queries";
import type { Plan } from "../schemas";
import { CreatePlanDialog } from "./create-plan-dialog";

export function PlatformPlansTable() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: plans = [], isLoading, error } = usePlatformPlans({ includeInactive: true });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase">
              Configured SaaS Tiers
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold">
              {plans?.length ?? 0}
              <Layers className="text-muted-foreground/60 h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-emerald-500 uppercase">
              Active Public Plans
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-emerald-500">
              {(plans ?? []).filter((p) => p?.isActive && p?.isPublic)?.length ?? 0}
              <CreditCard className="h-5 w-5 text-emerald-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-amber-500 uppercase">
              Seat Limit Max Tier
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-amber-500">
              500 Seats
              <Users className="h-5 w-5 text-amber-500/60" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/80">
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-base font-semibold">
                SaaS Commercial Pricing & Entitlements
              </CardTitle>
              <CardDescription className="text-xs">
                Canonical multi-tenant pricing models, seat limits, and storage quotas enforced
                platform-wide.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Provision New Tier
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-destructive p-8 text-center text-sm">
              Failed to load plans: {getErrorMessage(error)}
            </div>
          ) : (plans ?? []).length === 0 ? (
            <div className="text-muted-foreground p-12 text-center text-sm">
              No plans configured yet. Click &quot;Provision New Tier&quot; to seed initial models.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="font-mono text-xs uppercase">
                  <TableHead>Tier Key / Name</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Seat Capacity</TableHead>
                  <TableHead>Storage Quota</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(plans ?? []).map((plan: Plan) => (
                  <TableRow key={plan?.id} className="text-xs">
                    <TableCell>
                      <div className="text-foreground font-semibold">{plan?.name}</div>
                      <div className="text-muted-foreground font-mono text-[11px]">{plan?.key}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-mono font-bold">
                        {plan?.priceCents === 0
                          ? "$0"
                          : `$${((plan?.priceCents ?? 0) / 100).toFixed(0)}`}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {plan?.billingInterval?.toLowerCase()}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="text-muted-foreground h-3.5 w-3.5" />
                        <span>{plan?.entitlements?.maxMembers ?? 5} members</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <HardDrive className="text-muted-foreground h-3.5 w-3.5" />
                        <span>
                          {((plan?.entitlements?.maxStorageMb ?? 1024) / 1024).toFixed(0)} GB
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan?.entitlements?.hasCustomRoles ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-[10px] text-emerald-500"
                          >
                            Custom RBAC
                          </Badge>
                        ) : null}
                        {plan?.entitlements?.hasAdvancedAnalytics ? (
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 text-[10px] text-blue-500"
                          >
                            Analytics
                          </Badge>
                        ) : null}
                        {plan?.entitlements?.hasPrioritySupport ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-[10px] text-amber-500"
                          >
                            Priority SLA
                          </Badge>
                        ) : null}
                        {!plan?.entitlements?.hasCustomRoles &&
                        !plan?.entitlements?.hasAdvancedAnalytics &&
                        !plan?.entitlements?.hasPrioritySupport ? (
                          <span className="text-muted-foreground text-[11px]">Standard Core</span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {plan?.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 font-mono text-[10px] text-emerald-500"
                        >
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted text-muted-foreground font-mono text-[10px]"
                        >
                          INACTIVE
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreatePlanDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
