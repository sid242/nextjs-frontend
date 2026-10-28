"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  LifeBuoy,
  MoreVertical,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { hasPlatformPermission, PLATFORM_PERMISSION_KEYS } from "../permissions";
import {
  useActivateTenant,
  usePlatformMe,
  usePlatformTenants,
  useStartSupportSession,
  useSuspendTenant,
} from "../queries";
import type { PlatformTenant } from "../schemas";
import { PlatformPermissionGate } from "./platform-permission-gate";
import { ProvisionTenantDialog } from "./provision-tenant-dialog";

type TenantColumnId =
  "workspace" | "status" | "tier" | "owner" | "dbPool" | "createdAt" | "actions";

const TENANT_COLUMNS: TableColumnDef<TenantColumnId>[] = [
  { id: "workspace", label: "Workspace", canHide: false, defaultVisible: true },
  { id: "status", label: "Status", canHide: true, defaultVisible: true },
  { id: "tier", label: "Tier & Capacity", canHide: true, defaultVisible: true },
  { id: "owner", label: "Primary Owner", canHide: true, defaultVisible: true },
  { id: "dbPool", label: "Database Pool", canHide: true, defaultVisible: true },
  { id: "createdAt", label: "Created", canHide: true, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

const TENANT_COLUMN_LABELS: Record<TenantColumnId, string> = {
  workspace: "Workspace",
  status: "Status",
  tier: "Tier & Capacity",
  owner: "Primary Owner",
  dbPool: "Database Pool",
  createdAt: "Created",
  actions: "Actions",
};

const TENANT_STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Trialing", value: "TRIALING" },
  { label: "Deactivated", value: "DEACTIVATED" },
];

const TENANT_PLAN_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All Plans", value: "ALL" },
  { label: "Free", value: "FREE" },
  { label: "Starter", value: "STARTER" },
  { label: "Pro", value: "PRO" },
  { label: "Enterprise", value: "ENTERPRISE" },
];

interface TenantModalState {
  type: "suspend" | "activate" | "support" | "provision" | null;
  tenant: PlatformTenant | null;
  reason: string;
}

export function TenantsTable() {
  const { get, getNumber, setParam, setParams } = useSearchQueryParams();
  const [searchInput, setSearchInput] = useState<string>(() => get("q") ?? "");

  const syncSearchParam = useDebouncedCallback((val: string) => {
    setParams({ q: val.trim() || null, page: null }, { mode: "replace", scroll: false });
  }, 250);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value ?? "";
    setSearchInput(val);
    syncSearchParam.run(val);
  };

  const statusFilter = get("status") ?? "ALL";
  const planFilter = get("plan") ?? "ALL";
  const hasActiveFilters = Boolean(
    searchInput.trim() || statusFilter !== "ALL" || planFilter !== "ALL",
  );

  const clearFilters = () => {
    setSearchInput("");
    setParams(
      { q: null, status: null, plan: null, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const handleStatusChange = (val: string) => {
    setParams(
      { status: val === "ALL" ? null : val, page: null },
      { mode: "replace", scroll: false },
    );
  };

  const handlePlanChange = (val: string) => {
    setParams({ plan: val === "ALL" ? null : val, page: null }, { mode: "replace", scroll: false });
  };

  // Cohesive modal state replacing scattered targets & open flags
  const [modalState, setModalState] = useState<TenantModalState>({
    type: null,
    tenant: null,
    reason: "",
  });

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

  const { data: tenantsData, isLoading } = usePlatformTenants();
  const { mutateAsync: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutateAsync: activateTenant, isPending: isActivating } = useActivateTenant();
  const { mutateAsync: startSupportSession, isPending: isStartingSupport } =
    useStartSupportSession();
  const { data: staffMe } = usePlatformMe();

  const canStartSupport = hasPlatformPermission(staffMe, PLATFORM_PERMISSION_KEYS.SUPPORT_START);
  const canSuspendTenant = hasPlatformPermission(staffMe, PLATFORM_PERMISSION_KEYS.TENANTS_SUSPEND);

  const tenants = useMemo(() => tenantsData?.items ?? [], [tenantsData?.items]);

  const filteredTenants = useMemo(() => {
    const query = searchInput.toLowerCase();
    return tenants.filter((tenant) => {
      const matchesSearch =
        query === "" ||
        tenant?.name?.toLowerCase().includes(query) ||
        tenant?.slug?.toLowerCase().includes(query) ||
        tenant?.ownerEmail?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || tenant?.status === statusFilter;
      const matchesPlan = planFilter === "ALL" || tenant?.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchInput, statusFilter, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedTenants = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, safePage, pageSize]);

  const tableColumns = useTableColumns<TenantColumnId>({
    columns: TENANT_COLUMNS,
    tableId: "platform_tenants_table",
  });

  const activeCount = tenants.filter((t) => t?.status === "ACTIVE").length;
  const suspendedCount = tenants.filter((t) => t?.status === "SUSPENDED").length;
  const dedicatedCount = tenants.filter((t) => t?.databaseMode === "dedicated").length;

  const handleSuspend = async () => {
    if (!modalState.tenant || !modalState.reason.trim()) return;
    try {
      await suspendTenant({ id: modalState.tenant.id, reason: modalState.reason.trim() });
      setModalState({ type: null, tenant: null, reason: "" });
    } catch {
      /* handled by error toast in boundary */
    }
  };

  const handleActivate = async () => {
    if (!modalState.tenant) return;
    try {
      await activateTenant({ id: modalState.tenant.id, reason: "Reactivated by operator" });
      setModalState({ type: null, tenant: null, reason: "" });
    } catch {
      /* handled */
    }
  };

  const handleStartSupport = async () => {
    if (!modalState.tenant || !modalState.reason.trim()) return;
    try {
      const res = await startSupportSession({
        tenantId: modalState.tenant.id,
        reason: modalState.reason.trim(),
        durationMinutes: 30,
      });
      if (res?.sessionId) {
        await fetch("/api/platform/support-session/enter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: res.sessionId,
            tenantId: res.tenantId,
            accessToken: res.accessToken,
          }),
        });
        setModalState({ type: null, tenant: null, reason: "" });
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
      }
    } catch {
      /* handled */
    }
  };

  function renderCell(colId: TenantColumnId, t: PlatformTenant) {
    switch (colId) {
      case "workspace":
        return (
          <TableCell key="workspace" className="pl-6">
            <div className="flex flex-col">
              <Link
                href={`/platform/tenants/${t.id}`}
                className="hover:text-primary font-medium transition-colors"
              >
                {t.name}
              </Link>
              <span className="text-muted-foreground font-mono text-xs">slug: {t.slug}</span>
            </div>
          </TableCell>
        );
      case "status":
        return (
          <TableCell key="status">
            {t.status === "ACTIVE" && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                Active
              </Badge>
            )}
            {t.status === "SUSPENDED" && (
              <Badge
                variant="outline"
                className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              >
                Suspended
              </Badge>
            )}
            {t.status === "TRIALING" && (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                Trialing
              </Badge>
            )}
            {t.status === "DEACTIVATED" && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                Deactivated
              </Badge>
            )}
          </TableCell>
        );
      case "tier":
        return (
          <TableCell key="tier">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {t.plan}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {t.memberCount} {t.memberCount === 1 ? "seat" : "seats"}
              </span>
            </div>
          </TableCell>
        );
      case "owner":
        return (
          <TableCell key="owner">
            <div className="flex flex-col">
              <span className="text-xs">{t.ownerEmail ?? "—"}</span>
              {t.ownerName && (
                <span className="text-muted-foreground text-[10px]">{t.ownerName}</span>
              )}
            </div>
          </TableCell>
        );
      case "dbPool":
        return (
          <TableCell key="dbPool">
            <Badge
              variant="outline"
              className={
                t.databaseMode === "dedicated"
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "border-border text-muted-foreground"
              }
            >
              {t.databaseMode === "dedicated" ? "Dedicated DB" : "Shared Pool"}
            </Badge>
          </TableCell>
        );
      case "createdAt":
        return (
          <TableCell key="createdAt" className="text-muted-foreground text-xs">
            {formatDate(t.createdAt)}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key="actions" className="w-28 min-w-28 pr-4 text-right">
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted size-8 cursor-pointer"
                    aria-label="Organization actions"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Organization Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/platform/tenants/${t.id}`} className="gap-2">
                      <ExternalLink className="size-3.5" /> View Inspector
                    </Link>
                  </DropdownMenuItem>
                  {canStartSupport ? (
                    <DropdownMenuItem
                      onClick={() => setModalState({ type: "support", tenant: t, reason: "" })}
                      className="gap-2"
                    >
                      <LifeBuoy className="size-3.5 text-blue-500" /> Start Support Session
                    </DropdownMenuItem>
                  ) : null}

                  {canSuspendTenant ? (
                    <>
                      <DropdownMenuSeparator />
                      {t.status === "ACTIVE" ? (
                        <DropdownMenuItem
                          onClick={() => setModalState({ type: "suspend", tenant: t, reason: "" })}
                          className="gap-2 text-red-600 dark:text-red-400"
                        >
                          <PowerOff className="size-3.5" /> Suspend Workspace
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setModalState({ type: "activate", tenant: t, reason: "" })}
                          className="gap-2 text-emerald-600 dark:text-emerald-400"
                        >
                          <Power className="size-3.5" /> Reactivate Workspace
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Workspaces
            </CardTitle>
            <Building2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{tenants?.length ?? 0}</div>
            <p className="text-muted-foreground text-xs">Across all database tiers</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Active Tenants
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{activeCount}</div>
            <p className="text-muted-foreground text-xs">Operational & serving requests</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Suspended Organizations
            </CardTitle>
            <ShieldAlert className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{suspendedCount}</div>
            <p className="text-muted-foreground text-xs">Access blocked by policy or billing</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 rounded-2xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Dedicated DB Tenants
            </CardTitle>
            <Database className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{dedicatedCount}</div>
            <p className="text-muted-foreground text-xs">Isolated enterprise database pools</p>
          </CardContent>
        </Card>
      </div>

      {/* Main filterable table card */}
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Tenant Organizations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage customer workspace lifecycles, database routing modes, and subscription
                tiers.
              </CardDescription>
            </div>
            <PlatformPermissionGate
              permission={PLATFORM_PERMISSION_KEYS.TENANTS_MANAGE}
              hideInsteadOfBanner
            >
              <Button asChild className="h-10 gap-2 rounded-xl shadow-xs">
                <Link href="/platform/tenants/new">
                  <Plus className="size-4" />
                  Provision Organization
                </Link>
              </Button>
            </PlatformPermissionGate>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search organizations by name, slug, or owner email…"
                value={searchInput}
                onChange={handleSearchChange}
                className="h-10 rounded-xl pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-37.5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {TENANT_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={handlePlanChange}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-35">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {TENANT_PLAN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 gap-1.5 rounded-xl px-3 text-xs"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {tableColumns.orderedVisibleColumns.map((colId) => (
                    <TableHead
                      key={colId}
                      className={
                        colId === "workspace"
                          ? "pl-6"
                          : colId === "actions"
                            ? "w-28 min-w-28 pr-4 text-right"
                            : undefined
                      }
                    >
                      {colId === "actions" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-muted-foreground text-xs font-semibold">
                            Actions
                          </span>
                          <ColumnConfigDropdown
                            tableColumns={tableColumns}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted size-8 cursor-pointer"
                            align="end"
                          />
                        </div>
                      ) : (
                        TENANT_COLUMN_LABELS[colId]
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {tableColumns.orderedVisibleColumns.map((colId) => (
                        <TableCell
                          key={colId}
                          className={
                            colId === "workspace"
                              ? "pl-6"
                              : colId === "actions"
                                ? "pr-6 text-right"
                                : undefined
                          }
                        >
                          <Skeleton
                            className={colId === "actions" ? "ml-auto size-8" : "h-4 w-24"}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTenants?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.orderedVisibleColumns.length}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      No customer organizations match your search filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTenants.map((t) => (
                    <TableRow key={t.id}>
                      {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, t))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredTenants.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={(p) =>
              setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
            }
            itemLabel="organizations"
          />
        </CardContent>
      </Card>

      <ProvisionTenantDialog
        open={modalState.type === "provision"}
        onOpenChange={(open) =>
          setModalState({ type: open ? "provision" : null, tenant: null, reason: "" })
        }
      />

      {/* Suspend Confirmation Dialog */}
      <Dialog
        open={modalState.type === "suspend"}
        onOpenChange={(open) =>
          setModalState({ type: open ? "suspend" : null, tenant: null, reason: "" })
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="size-5" /> Suspend Tenant Organization
            </DialogTitle>
            <DialogDescription>
              Suspending <strong>{modalState.tenant?.name}</strong> will immediately block member
              access across API gateways and WebSocket connections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason" className="text-xs font-semibold">
              Reason for Suspension (Recorded in Audit Trail)
            </Label>
            <Textarea
              id="suspend-reason"
              placeholder="e.g. Terms of Service violation, overdue invoices, or customer dispute"
              value={modalState.reason}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, reason: e?.target?.value ?? "" }))
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalState({ type: null, tenant: null, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!modalState.reason.trim() || isSuspending}
            >
              {isSuspending ? "Suspending…" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog
        open={modalState.type === "activate"}
        onOpenChange={(open) =>
          setModalState({ type: open ? "activate" : null, tenant: null, reason: "" })
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" /> Reactivate Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore active status for{" "}
              <strong>{modalState.tenant?.name}</strong>? Member login and API traffic will resume.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalState({ type: null, tenant: null, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isActivating ? "Reactivating…" : "Confirm Reactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Session Dialog */}
      <Dialog
        open={modalState.type === "support"}
        onOpenChange={(open) =>
          setModalState({ type: open ? "support" : null, tenant: null, reason: "" })
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <LifeBuoy className="size-5" /> Start Audited Support Delegation
            </DialogTitle>
            <DialogDescription>
              Initiate a 30-minute time-bound troubleshooting delegation for{" "}
              <strong>{modalState.tenant?.name}</strong>. All operator actions will be logged in
              compliance audit trails.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="support-reason" className="text-xs font-semibold">
              Support Delegation Reason
            </Label>
            <Textarea
              id="support-reason"
              placeholder="e.g. Troubleshooting tenant billing and member role misconfiguration"
              value={modalState.reason}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, reason: e?.target?.value ?? "" }))
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalState({ type: null, tenant: null, reason: "" })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSupport}
              disabled={!modalState.reason.trim() || isStartingSupport}
            >
              {isStartingSupport ? "Starting Delegation…" : "Start Support Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
