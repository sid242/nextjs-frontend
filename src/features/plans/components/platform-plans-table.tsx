"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CreditCard, Globe, HardDrive, Layers, Pencil, Plus, Users } from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
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
import { PLATFORM_PERMISSION_KEYS, PlatformPermissionGate } from "@/features/platform";
import { getErrorMessage } from "@/lib/api/errors";
import { useSearchQueryParams, useTableColumns, type TableColumnDef } from "@/lib/hooks";

import { usePlatformPlans } from "../queries";
import type { Plan } from "../schemas";

type PlanColumnId = "tier" | "pricing" | "capacity" | "quota" | "features" | "status" | "actions";

const PLAN_COLUMNS: TableColumnDef<PlanColumnId>[] = [
  { id: "tier", label: "Tier Key & Name", canHide: false, defaultVisible: true },
  { id: "pricing", label: "Retail Pricing", canHide: true, defaultVisible: true },
  { id: "capacity", label: "Seat Capacity", canHide: true, defaultVisible: true },
  { id: "quota", label: "Cloud Storage Quota", canHide: true, defaultVisible: true },
  { id: "features", label: "Included Features", canHide: true, defaultVisible: true },
  { id: "status", label: "Status & Catalog", canHide: false, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const PLAN_COLUMN_LABELS: Record<PlanColumnId, string> = {
  tier: "Tier Key & Name",
  pricing: "Retail Pricing",
  capacity: "Seat Capacity",
  quota: "Cloud Storage Quota",
  features: "Included Features",
  status: "Status & Catalog",
  actions: "Actions",
};

export function PlatformPlansTable() {
  const { getNumber, setParam, setParams } = useSearchQueryParams();
  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const handlePageSizeChange = (newSize: number) => {
    setParams(
      { limit: newSize === 10 ? null : newSize, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const { data: plans = [], isLoading, error } = usePlatformPlans({ includeInactive: true });

  const totalPages = Math.max(1, Math.ceil((plans?.length ?? 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedPlans = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return (plans ?? []).slice(start, start + pageSize);
  }, [plans, safePage, pageSize]);

  const maxSeatOffering = useMemo(() => {
    if (!plans || plans.length === 0) return 0;
    return Math.max(...plans.map((p) => p.entitlements?.maxMembers ?? 0));
  }, [plans]);

  const tableColumns = useTableColumns<PlanColumnId>({
    columns: PLAN_COLUMNS,
    tableId: "platform_plans_table",
  });

  function renderCell(colId: PlanColumnId, plan: Plan) {
    switch (colId) {
      case "tier":
        return (
          <TableCell key="tier" className="py-3.5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary border-primary/20 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                <Layers className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-foreground truncate text-xs font-semibold">{plan?.name}</div>
                <div className="text-muted-foreground truncate font-mono text-[11px]">
                  {plan?.key}
                </div>
              </div>
            </div>
          </TableCell>
        );
      case "pricing": {
        const isFree = (plan?.priceCents ?? 0) === 0;
        const formattedPrice = isFree ? "$0" : `$${((plan?.priceCents ?? 0) / 100).toFixed(0)}`;
        return (
          <TableCell key="pricing" className="py-3.5">
            <div className="flex items-baseline gap-1">
              <span className="text-foreground font-mono text-xs font-bold">{formattedPrice}</span>
              <span className="text-muted-foreground text-[10px]">
                {plan?.currency ?? "USD"} / {plan?.billingInterval?.toLowerCase()}
              </span>
            </div>
          </TableCell>
        );
      }
      case "capacity":
        return (
          <TableCell key="capacity" className="py-3.5">
            <div className="text-foreground flex items-center gap-1.5 text-xs font-medium">
              <Users className="text-muted-foreground size-3.5" />
              <span>{plan?.entitlements?.maxMembers ?? 5} team seats</span>
            </div>
          </TableCell>
        );
      case "quota": {
        const storageMb = plan?.entitlements?.maxStorageMb ?? 1024;
        const storageGb = (storageMb / 1024).toFixed(0);
        return (
          <TableCell key="quota" className="py-3.5">
            <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
              <HardDrive className="size-3.5" />
              <span>{storageGb} GB</span>
            </div>
          </TableCell>
        );
      }
      case "features":
        return (
          <TableCell key="features" className="py-3.5">
            <div className="flex flex-wrap items-center gap-1">
              {plan?.entitlements?.hasCustomRoles ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 font-mono text-[9px] text-emerald-600 dark:text-emerald-400"
                >
                  Custom RBAC
                </Badge>
              ) : null}
              {plan?.entitlements?.hasAdvancedAnalytics ? (
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 px-1.5 py-0 font-mono text-[9px] text-blue-600 dark:text-blue-400"
                >
                  Analytics
                </Badge>
              ) : null}
              {plan?.entitlements?.hasPrioritySupport ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 font-mono text-[9px] text-amber-600 dark:text-amber-400"
                >
                  Priority SLA
                </Badge>
              ) : null}
              {!plan?.entitlements?.hasCustomRoles &&
              !plan?.entitlements?.hasAdvancedAnalytics &&
              !plan?.entitlements?.hasPrioritySupport ? (
                <span className="text-muted-foreground font-mono text-[10px]">Standard Core</span>
              ) : null}
            </div>
          </TableCell>
        );
      case "status":
        return (
          <TableCell key="status" className="py-3.5 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {plan?.isActive ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
                >
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
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
              {plan?.isPublic ? (
                <Badge variant="secondary" className="px-1 font-mono text-[9px]">
                  PUBLIC
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground px-1 font-mono text-[9px]"
                >
                  PRIVATE
                </Badge>
              )}
            </div>
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key="actions" className="py-3.5 text-right">
            <PlatformPermissionGate
              permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}
              hideInsteadOfBanner
            >
              <Button asChild variant="outline" size="sm" className="h-7 gap-1 text-xs shadow-2xs">
                <Link href={`/platform/plans/${plan?.id}/edit`}>
                  <Pencil className="size-3" />
                  <span>Edit Tier</span>
                </Link>
              </Button>
            </PlatformPermissionGate>
          </TableCell>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase">
              Configured SaaS Tiers
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold">
              {plans?.length ?? 0}
              <Layers className="text-muted-foreground/60 size-5" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-emerald-600 uppercase dark:text-emerald-400">
              Active Commercial Tiers
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(plans ?? []).filter((p) => p?.isActive)?.length ?? 0}
              <CreditCard className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-blue-600 uppercase dark:text-blue-400">
              Public Self-Serve Plans
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(plans ?? []).filter((p) => p?.isActive && p?.isPublic)?.length ?? 0}
              <Globe className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-amber-600 uppercase dark:text-amber-400">
              Peak Seat Offering
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-amber-600 dark:text-amber-400">
              {maxSeatOffering} Seats
              <Users className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-base font-semibold">
                Commercial Pricing &amp; Entitlements
              </CardTitle>
              <CardDescription className="text-xs">
                Canonical multi-tenant pricing models, seat limits, and storage quotas enforced
                platform-wide.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ColumnConfigDropdown tableColumns={tableColumns} />
              <PlatformPermissionGate
                permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}
                hideInsteadOfBanner
              >
                <Button asChild size="sm" className="h-9 gap-1.5 rounded-xl text-xs shadow-xs">
                  <Link href="/platform/plans/new">
                    <Plus className="size-3.5" />
                    Provision New Tier
                  </Link>
                </Button>
              </PlatformPermissionGate>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
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
            <div>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="font-mono text-xs uppercase">
                      {tableColumns.orderedVisibleColumns.map((colId) => (
                        <TableHead
                          key={colId}
                          className={colId === "status" ? "text-right" : undefined}
                        >
                          {PLAN_COLUMN_LABELS[colId]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPlans.map((plan: Plan) => (
                      <TableRow key={plan?.id} className="text-xs">
                        {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, plan))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={plans?.length ?? 0}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={handlePageSizeChange}
                onPageChange={(p) =>
                  setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
                }
                itemLabel="pricing tiers"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
