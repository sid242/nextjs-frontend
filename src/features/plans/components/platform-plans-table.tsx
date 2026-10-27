"use client";

import { useMemo, useState } from "react";
import { CreditCard, HardDrive, Layers, Pencil, Plus, Users } from "lucide-react";

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
import { CreatePlanDialog } from "./create-plan-dialog";
import { EditPlanDialog } from "./edit-plan-dialog";

type PlanColumnId = "tier" | "pricing" | "capacity" | "quota" | "features" | "status" | "actions";

const PLAN_COLUMNS: TableColumnDef<PlanColumnId>[] = [
  { id: "tier", label: "Tier Key / Name", canHide: false, defaultVisible: true },
  { id: "pricing", label: "Pricing", canHide: true, defaultVisible: true },
  { id: "capacity", label: "Seat Capacity", canHide: true, defaultVisible: true },
  { id: "quota", label: "Storage Quota", canHide: true, defaultVisible: true },
  { id: "features", label: "Features", canHide: true, defaultVisible: true },
  { id: "status", label: "Status", canHide: false, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const PLAN_COLUMN_LABELS: Record<PlanColumnId, string> = {
  tier: "Tier Key / Name",
  pricing: "Pricing",
  capacity: "Seat Capacity",
  quota: "Storage Quota",
  features: "Features",
  status: "Status",
  actions: "Actions",
};

export function PlatformPlansTable() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<Plan | null>(null);
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

  const tableColumns = useTableColumns<PlanColumnId>({
    columns: PLAN_COLUMNS,
    tableId: "platform_plans_table",
  });

  function renderCell(colId: PlanColumnId, plan: Plan) {
    switch (colId) {
      case "tier":
        return (
          <TableCell key="tier">
            <div className="text-foreground font-semibold">{plan?.name}</div>
            <div className="text-muted-foreground font-mono text-[11px]">{plan?.key}</div>
          </TableCell>
        );
      case "pricing":
        return (
          <TableCell key="pricing">
            <div className="font-mono font-bold">
              {plan?.priceCents === 0 ? "$0" : `$${((plan?.priceCents ?? 0) / 100).toFixed(0)}`}
            </div>
            <div className="text-muted-foreground text-[10px]">
              {plan?.billingInterval?.toLowerCase()}
            </div>
          </TableCell>
        );
      case "capacity":
        return (
          <TableCell key="capacity">
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="text-muted-foreground h-3.5 w-3.5" />
              <span>{plan?.entitlements?.maxMembers ?? 5} members</span>
            </div>
          </TableCell>
        );
      case "quota":
        return (
          <TableCell key="quota">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <HardDrive className="text-muted-foreground h-3.5 w-3.5" />
              <span>{((plan?.entitlements?.maxStorageMb ?? 1024) / 1024).toFixed(0)} GB</span>
            </div>
          </TableCell>
        );
      case "features":
        return (
          <TableCell key="features">
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
                <Badge variant="outline" className="border-blue-500/40 text-[10px] text-blue-500">
                  Analytics
                </Badge>
              ) : null}
              {plan?.entitlements?.hasPrioritySupport ? (
                <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-500">
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
        );
      case "status":
        return (
          <TableCell key="status">
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
        );
      case "actions":
        return (
          <TableCell key="actions" className="text-right">
            <PlatformPermissionGate
              permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}
              hideInsteadOfBanner
            >
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent h-7 gap-1.5 px-2 text-xs font-medium"
                onClick={() => {
                  setSelectedPlanForEdit(plan);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            </PlatformPermissionGate>
          </TableCell>
        );
    }
  }

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
            <div className="flex items-center gap-2">
              <ColumnConfigDropdown tableColumns={tableColumns} />
              <PlatformPermissionGate
                permission={PLATFORM_PERMISSION_KEYS.BILLING_MANAGE}
                hideInsteadOfBanner
              >
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-1.5 text-xs shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Provision New Tier
                </Button>
              </PlatformPermissionGate>
            </div>
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
            <div>
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

      <CreatePlanDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        plan={selectedPlanForEdit}
      />
    </div>
  );
}
