"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

import { ColumnConfigDropdown } from "@/components/molecules/column-config-dropdown";
import { TablePagination } from "@/components/molecules/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import {
  useDebouncedCallback,
  useSearchQueryParams,
  useTableColumns,
  type TableColumnDef,
} from "@/lib/hooks";

import { hasPlatformPermission, PLATFORM_PERMISSION_KEYS } from "../permissions";
import { useExecuteTenantDatabaseOperation, usePlatformMe, useTenantDatabases } from "../queries";
import type {
  ExecuteTenantDatabaseOperationInput,
  ListTenantDatabasesQuery,
  TenantDatabaseItem,
} from "../schemas";

type DatabaseColumnId =
  | "workspace"
  | "strategy"
  | "provisioning"
  | "region"
  | "schemaVersion"
  | "health"
  | "migration"
  | "actions";

const DATABASE_COLUMNS: TableColumnDef<DatabaseColumnId>[] = [
  { id: "workspace", label: "Tenant Workspace", canHide: false, defaultVisible: true },
  { id: "strategy", label: "Strategy", canHide: true, defaultVisible: true },
  { id: "provisioning", label: "Provisioning Status", canHide: true, defaultVisible: true },
  { id: "region", label: "Region", canHide: true, defaultVisible: true },
  { id: "schemaVersion", label: "Schema Version", canHide: true, defaultVisible: true },
  { id: "health", label: "Health & Ping", canHide: true, defaultVisible: true },
  { id: "migration", label: "Last Migration", canHide: true, defaultVisible: true },
  { id: "actions", label: "Actions", canHide: false, defaultVisible: true },
];

export function DatabaseOperationsTable() {
  const { data: me } = usePlatformMe();
  const canManageTenants = hasPlatformPermission(me, PLATFORM_PERMISSION_KEYS.TENANTS_MANAGE);

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

  const strategyFilter = (get("strategy") ?? "ALL") as "shared" | "dedicated" | "ALL";
  const provisioningStatusFilter = get("provisioningStatus") ?? "ALL";
  const migrationStatusFilter = get("migrationStatus") ?? "ALL";
  const healthStatusFilter = get("healthStatus") ?? "ALL";

  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 20) ?? 20;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 20;

  const [selectedTenant, setSelectedTenant] = useState<TenantDatabaseItem | null>(null);
  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [opAction, setOpAction] =
    useState<ExecuteTenantDatabaseOperationInput["action"]>("HEALTH_CHECK");
  const [opReason, setOpReason] = useState("");
  const [opTargetVersion, setOpTargetVersion] = useState("");
  const [opMaintenanceWindow, setOpMaintenanceWindow] = useState("");
  const [opCustomDbName, setOpCustomDbName] = useState("");
  const [opPoolLimit, setOpPoolLimit] = useState(10);
  const [opBackupConfirmed, setOpBackupConfirmed] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [opSuccessMessage, setOpSuccessMessage] = useState<string | null>(null);

  const tableColumns = useTableColumns<DatabaseColumnId>({
    columns: DATABASE_COLUMNS,
    tableId: "platform_database_operations_table",
  });

  const queryFilters = useMemo(() => {
    return {
      page,
      limit: pageSize,
      search: searchInput.trim() || undefined,
      strategy: strategyFilter !== "ALL" ? strategyFilter : undefined,
      provisioningStatus:
        provisioningStatusFilter !== "ALL"
          ? (provisioningStatusFilter as ListTenantDatabasesQuery["provisioningStatus"])
          : undefined,
      migrationStatus:
        migrationStatusFilter !== "ALL"
          ? (migrationStatusFilter as ListTenantDatabasesQuery["migrationStatus"])
          : undefined,
      healthStatus:
        healthStatusFilter !== "ALL"
          ? (healthStatusFilter as ListTenantDatabasesQuery["healthStatus"])
          : undefined,
    };
  }, [
    page,
    pageSize,
    searchInput,
    strategyFilter,
    provisioningStatusFilter,
    migrationStatusFilter,
    healthStatusFilter,
  ]);

  const { data, isLoading, isError, refetch } = useTenantDatabases(queryFilters);
  const executeMutation = useExecuteTenantDatabaseOperation();

  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const openOperationModal = (
    tenant: TenantDatabaseItem,
    defaultAction: ExecuteTenantDatabaseOperationInput["action"] = "HEALTH_CHECK",
  ) => {
    setSelectedTenant(tenant);
    setOpAction(defaultAction);
    setOpReason("");
    setOpTargetVersion(tenant?.schemaVersion || "1.0.0");
    setOpMaintenanceWindow(tenant?.maintenanceWindow || "");
    setOpCustomDbName("");
    setOpPoolLimit(10);
    setOpBackupConfirmed(false);
    setOpError(null);
    setOpSuccessMessage(null);
    setOperationModalOpen(true);
  };

  const handleSubmitOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    if (!opReason || opReason.trim().length < 5) {
      setOpError("Reason must be at least 5 characters long for operator audit logging.");
      return;
    }
    if ((opAction === "ROLLBACK" || opAction === "RESTORE") && !opBackupConfirmed) {
      setOpError("You must explicitly verify and confirm that a backup snapshot exists.");
      return;
    }

    setOpError(null);
    try {
      const payload: ExecuteTenantDatabaseOperationInput = {
        action: opAction,
        reason: opReason.trim(),
        targetVersion: opTargetVersion.trim() || undefined,
        maintenanceWindow: opMaintenanceWindow.trim() || undefined,
        backupConfirmed: opBackupConfirmed,
        poolLimit: opAction === "MIGRATE" ? opPoolLimit : undefined,
        customDatabaseName:
          opAction === "MIGRATE" && opCustomDbName.trim() ? opCustomDbName.trim() : undefined,
      };

      const result = await executeMutation.mutateAsync({
        tenantId: selectedTenant.id,
        input: payload,
      });

      setOpSuccessMessage(
        `Operation ${opAction} completed successfully for ${selectedTenant.name}. Details: ${JSON.stringify(
          result,
        )}`,
      );
      setTimeout(() => {
        setOperationModalOpen(false);
        setOpSuccessMessage(null);
      }, 1500);
    } catch (err) {
      setOpError(getErrorMessage(err));
    }
  };

  const renderHealthBadge = (health: TenantDatabaseItem["health"]) => {
    const status = health?.status ?? "UNKNOWN";
    if (status === "HEALTHY") {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/30 bg-emerald-500/10 font-mono text-xs text-emerald-600"
        >
          <CheckCircle2 className="h-3 w-3" />
          HEALTHY{" "}
          {health?.latencyMs !== null && health?.latencyMs !== undefined
            ? `(${health.latencyMs}ms)`
            : ""}
        </Badge>
      );
    }
    if (status === "UNHEALTHY") {
      return (
        <Badge variant="destructive" className="gap-1 font-mono text-xs">
          <AlertCircle className="h-3 w-3" />
          UNHEALTHY
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-muted-foreground gap-1 font-mono text-xs">
        UNKNOWN
      </Badge>
    );
  };

  const renderProvisioningBadge = (status: TenantDatabaseItem["provisioningStatus"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          >
            ACTIVE
          </Badge>
        );
      case "PROVISIONING":
      case "PENDING":
        return (
          <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
            {status}
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">FAILED</Badge>;
      case "SUSPENDED":
        return (
          <Badge variant="outline" className="border-red-500/30 text-red-600">
            SUSPENDED
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderCell = (colId: DatabaseColumnId, item: TenantDatabaseItem) => {
    switch (colId) {
      case "workspace":
        return (
          <TableCell key="workspace">
            <div className="text-foreground font-semibold">{item.name}</div>
            <div className="text-muted-foreground font-mono text-xs">
              {item.slug} {item.tenantCode ? `• [${item.tenantCode}]` : ""}
            </div>
          </TableCell>
        );
      case "strategy":
        return (
          <TableCell key="strategy">
            {item.strategy === "dedicated" ? (
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 font-mono text-indigo-600"
              >
                DEDICATED
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-mono">
                SHARED
              </Badge>
            )}
            <div className="text-muted-foreground mt-0.5 font-mono text-[11px]">
              {item.databaseName}
            </div>
          </TableCell>
        );
      case "provisioning":
        return (
          <TableCell key="provisioning">
            {renderProvisioningBadge(item.provisioningStatus)}
            {item.provisioningError && (
              <div className="text-destructive mt-0.5 max-w-[180px] truncate text-[11px]">
                {item.provisioningError}
              </div>
            )}
          </TableCell>
        );
      case "region":
        return (
          <TableCell key="region" className="font-mono text-xs">
            {item.region}
          </TableCell>
        );
      case "schemaVersion":
        return (
          <TableCell key="schemaVersion">
            <Badge variant="outline" className="font-mono text-xs">
              v{item.schemaVersion}
            </Badge>
          </TableCell>
        );
      case "health":
        return (
          <TableCell key="health">
            {renderHealthBadge(item.health)}
            {item.health?.lastCheckedAt && (
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {formatDate(item.health.lastCheckedAt)}
              </div>
            )}
          </TableCell>
        );
      case "migration":
        return (
          <TableCell key="migration">
            <Badge
              variant={
                item.migrationStatus === "UP_TO_DATE"
                  ? "outline"
                  : item.migrationStatus === "FAILED"
                    ? "destructive"
                    : "secondary"
              }
              className="font-mono text-xs"
            >
              {item.migrationStatus}
            </Badge>
            {item.lastMigrationAt && (
              <div className="text-muted-foreground mt-0.5 text-[11px]">
                {formatDate(item.lastMigrationAt)}
              </div>
            )}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell key="actions" className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  Operate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Database Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openOperationModal(item, "HEALTH_CHECK")}
                  className="cursor-pointer gap-2"
                >
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Run Health Check
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openOperationModal(item, "BACKUP")}
                  className="cursor-pointer gap-2"
                >
                  <Archive className="h-4 w-4 text-sky-500" />
                  Create Backup Snapshot
                </DropdownMenuItem>

                {canManageTenants && (
                  <>
                    <DropdownMenuSeparator />
                    {item.strategy === "shared" ? (
                      <DropdownMenuItem
                        onClick={() => openOperationModal(item, "MIGRATE")}
                        className="cursor-pointer gap-2 font-medium text-indigo-600"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Migrate to Dedicated
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => openOperationModal(item, "MIGRATE")}
                          className="cursor-pointer gap-2 font-medium"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Apply Target Version
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openOperationModal(item, "ROLLBACK")}
                          className="text-destructive focus:text-destructive cursor-pointer gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Rollback to Shared
                        </DropdownMenuItem>
                      </>
                    )}

                    {item.provisioningStatus === "FAILED" && (
                      <DropdownMenuItem
                        onClick={() => openOperationModal(item, "RETRY_PROVISIONING")}
                        className="cursor-pointer gap-2 text-amber-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry Provisioning
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        );
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Database className="text-primary h-5 w-5" />
              Tenant Database Operations
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Monitor tenant schema versioning, database placement strategies, health checks &
              migration concurrency.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ColumnConfigDropdown tableColumns={tableColumns} />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Filter by name or slug..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <Select
            value={strategyFilter}
            onValueChange={(val) =>
              setParams(
                { strategy: val === "ALL" ? null : val, page: null },
                { mode: "replace", scroll: false },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Strategies</SelectItem>
              <SelectItem value="shared">Shared Pool</SelectItem>
              <SelectItem value="dedicated">Dedicated Database</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={provisioningStatusFilter}
            onValueChange={(val) =>
              setParams(
                { provisioningStatus: val === "ALL" ? null : val, page: null },
                { mode: "replace", scroll: false },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Provisioning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PROVISIONING">Provisioning</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={migrationStatusFilter}
            onValueChange={(val) =>
              setParams(
                { migrationStatus: val === "ALL" ? null : val, page: null },
                { mode: "replace", scroll: false },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Migration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Migrations</SelectItem>
              <SelectItem value="UP_TO_DATE">Up to Date</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="MIGRATING">Migrating</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={healthStatusFilter}
            onValueChange={(val) =>
              setParams(
                { healthStatus: val === "ALL" ? null : val, page: null },
                { mode: "replace", scroll: false },
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Health States</SelectItem>
              <SelectItem value="HEALTHY">Healthy</SelectItem>
              <SelectItem value="UNHEALTHY">Unhealthy</SelectItem>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load tenant database operations registry. Please check your network and
              permissions.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.orderedVisibleColumns.map((colId) => (
                  <TableHead key={colId} className={colId === "actions" ? "text-right" : undefined}>
                    {DATABASE_COLUMNS.find((c) => c.id === colId)?.label ?? colId}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={tableColumns.orderedVisibleColumns.length}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (data?.items?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.orderedVisibleColumns.length}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No tenant databases found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((item) => (
                  <TableRow key={item.id}>
                    {tableColumns.orderedVisibleColumns.map((colId) => renderCell(colId, item))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <TablePagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(sz) =>
              setParams(
                { limit: sz === 20 ? null : sz, page: null },
                { mode: "replace", scroll: false },
              )
            }
            onPageChange={(p) =>
              setParam("page", p <= 1 ? null : p, { mode: "replace", scroll: false })
            }
            itemLabel="databases"
          />
        </div>
      </CardContent>

      {/* Database Operation Execution Dialog */}
      <Dialog open={operationModalOpen} onOpenChange={setOperationModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmitOperation}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="text-primary h-5 w-5" />
                Execute Database Operation
              </DialogTitle>
              <DialogDescription>
                Target Workspace:{" "}
                <span className="text-foreground font-semibold">
                  {selectedTenant?.name} ({selectedTenant?.slug})
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {opError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{opError}</AlertDescription>
                </Alert>
              )}

              {opSuccessMessage && (
                <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{opSuccessMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="opAction">Operation Action</Label>
                <Select
                  value={opAction}
                  onValueChange={(val) =>
                    setOpAction(val as ExecuteTenantDatabaseOperationInput["action"])
                  }
                >
                  <SelectTrigger id="opAction">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH_CHECK">HEALTH_CHECK (Ping DB & Latency)</SelectItem>
                    <SelectItem value="MIGRATE">
                      MIGRATE (Dedicated / Target Schema Version)
                    </SelectItem>
                    <SelectItem value="BACKUP">BACKUP (Create Point-in-time Snapshot)</SelectItem>
                    <SelectItem value="RESTORE">RESTORE (Restore from Snapshot)</SelectItem>
                    <SelectItem value="ROLLBACK">ROLLBACK (Dedicated to Shared Pool)</SelectItem>
                    <SelectItem value="RETRY_PROVISIONING">
                      RETRY_PROVISIONING (Retry Failed Setup)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(opAction === "MIGRATE" || opAction === "RESTORE") && (
                <div className="space-y-2">
                  <Label htmlFor="targetVersion">Target Schema Version (Semver)</Label>
                  <Input
                    id="targetVersion"
                    placeholder="e.g. 1.2.0"
                    value={opTargetVersion}
                    onChange={(e) => setOpTargetVersion(e.target.value)}
                  />
                </div>
              )}

              {opAction === "MIGRATE" && selectedTenant?.strategy === "shared" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customDbName">Custom Database Name (Optional)</Label>
                    <Input
                      id="customDbName"
                      placeholder={`tenant_${selectedTenant?.slug?.replace(/-/g, "_")}`}
                      value={opCustomDbName}
                      onChange={(e) => setOpCustomDbName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poolLimit">Dedicated Connection Pool Limit</Label>
                    <Input
                      id="poolLimit"
                      type="number"
                      min={1}
                      max={50}
                      value={opPoolLimit}
                      onChange={(e) => setOpPoolLimit(Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="maintenanceWindow">Maintenance Window (Optional)</Label>
                <Input
                  id="maintenanceWindow"
                  placeholder="e.g. 2026-11-10T02:00:00Z - 04:00:00Z"
                  value={opMaintenanceWindow}
                  onChange={(e) => setOpMaintenanceWindow(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opReason">
                  Operational Justification / Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="opReason"
                  placeholder="State the technical reason and ticket/incident reference (min 5 characters)..."
                  value={opReason}
                  onChange={(e) => setOpReason(e.target.value)}
                  rows={3}
                />
              </div>

              {(opAction === "ROLLBACK" || opAction === "RESTORE") && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Destructive / High-Impact Operation Guard
                      </p>
                      <p className="text-muted-foreground text-xs">
                        This operation alters database schema topology. A confirmed backup snapshot
                        is mandatory.
                      </p>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="backupConfirmed"
                          checked={opBackupConfirmed}
                          onCheckedChange={(c) => setOpBackupConfirmed(Boolean(c))}
                        />
                        <label
                          htmlFor="backupConfirmed"
                          className="text-foreground cursor-pointer text-xs font-medium"
                        >
                          I verify and confirm that a backup snapshot exists for this tenant.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOperationModalOpen(false)}
                disabled={executeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={executeMutation.isPending}
                variant={opAction === "ROLLBACK" ? "destructive" : "default"}
              >
                {executeMutation.isPending ? "Executing..." : `Execute ${opAction}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
