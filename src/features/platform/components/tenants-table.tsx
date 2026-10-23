"use client";

import { useMemo, useState } from "react";
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
  Search,
  ShieldAlert,
} from "lucide-react";

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

import {
  useActivateTenant,
  usePlatformTenants,
  useStartSupportSession,
  useSuspendTenant,
} from "../queries";
import type { PlatformTenant } from "../schemas";
import { ProvisionTenantDialog } from "./provision-tenant-dialog";

export function TenantsTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [provisionOpen, setProvisionOpen] = useState(false);

  // Modals for tenant actions
  const [suspendTarget, setSuspendTarget] = useState<PlatformTenant | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [activateTarget, setActivateTarget] = useState<PlatformTenant | null>(null);
  const [supportTarget, setSupportTarget] = useState<PlatformTenant | null>(null);
  const [supportReason, setSupportReason] = useState("");

  const { data: tenantsData, isLoading } = usePlatformTenants();
  const { mutateAsync: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutateAsync: activateTenant, isPending: isActivating } = useActivateTenant();
  const { mutateAsync: startSupportSession, isPending: isStartingSupport } =
    useStartSupportSession();

  const tenants = useMemo(() => tenantsData?.items ?? [], [tenantsData?.items]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        search === "" ||
        tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
        tenant?.slug?.toLowerCase().includes(search.toLowerCase()) ||
        tenant?.ownerEmail?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || tenant?.status === statusFilter;
      const matchesPlan = planFilter === "ALL" || tenant?.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, search, statusFilter, planFilter]);

  const activeCount = tenants.filter((t) => t?.status === "ACTIVE").length;
  const suspendedCount = tenants.filter((t) => t?.status === "SUSPENDED").length;
  const dedicatedCount = tenants.filter((t) => t?.databaseMode === "dedicated").length;

  const handleSuspend = async () => {
    if (!suspendTarget || !suspendReason.trim()) return;
    try {
      await suspendTenant({ id: suspendTarget.id, reason: suspendReason.trim() });
      setSuspendTarget(null);
      setSuspendReason("");
    } catch {
      /* handled by error toast in boundary */
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    try {
      await activateTenant({ id: activateTarget.id, reason: "Reactivated by operator" });
      setActivateTarget(null);
    } catch {
      /* handled */
    }
  };

  const handleStartSupport = async () => {
    if (!supportTarget || !supportReason.trim()) return;
    try {
      await startSupportSession({
        tenantId: supportTarget.id,
        reason: supportReason.trim(),
        durationMinutes: 30,
      });
      setSupportTarget(null);
      setSupportReason("");
    } catch {
      /* handled */
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Workspaces
            </CardTitle>
            <Building2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-muted-foreground text-[11px]">Across all database tiers</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Active Tenants
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-muted-foreground text-[11px]">Operational & serving requests</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Suspended Organizations
            </CardTitle>
            <ShieldAlert className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedCount}</div>
            <p className="text-muted-foreground text-[11px]">Access blocked by policy or billing</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Dedicated DB Tenants
            </CardTitle>
            <Database className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dedicatedCount}</div>
            <p className="text-muted-foreground text-[11px]">Isolated enterprise database pools</p>
          </CardContent>
        </Card>
      </div>

      {/* Main filterable table card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Tenant Organizations</CardTitle>
              <CardDescription className="text-xs">
                Manage customer workspace lifecycles, database routing modes, and subscription
                tiers.
              </CardDescription>
            </div>
            <Button onClick={() => setProvisionOpen(true)} className="gap-2 shadow-xs">
              <Plus className="size-4" />
              Provision Organization
            </Button>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search organizations by name, slug, or owner email…"
                value={search}
                onChange={(e) => setSearch(e?.target?.value ?? "")}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TRIALING">Trialing</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plans</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Workspace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier & Capacity</TableHead>
                <TableHead>Primary Owner</TableHead>
                <TableHead>Database Pool</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px] pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Skeleton className="ml-auto size-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTenants?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No customer organizations match your search filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <Link
                          href={`/platform/tenants/${t.id}`}
                          className="hover:text-primary font-medium transition-colors"
                        >
                          {t.name}
                        </Link>
                        <span className="text-muted-foreground font-mono text-xs">
                          slug: {t.slug}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
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

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {t.plan}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {t.memberCount} {t.memberCount === 1 ? "seat" : "seats"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{t.ownerEmail ?? "—"}</span>
                        {t.ownerName && (
                          <span className="text-muted-foreground text-[10px]">{t.ownerName}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
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

                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs">
                            Organization Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/platform/tenants/${t.id}`} className="gap-2">
                              <ExternalLink className="size-3.5" /> View Inspector
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSupportTarget(t)} className="gap-2">
                            <LifeBuoy className="size-3.5 text-blue-500" /> Start Support Session
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {t.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              onClick={() => setSuspendTarget(t)}
                              className="gap-2 text-red-600 dark:text-red-400"
                            >
                              <PowerOff className="size-3.5" /> Suspend Workspace
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setActivateTarget(t)}
                              className="gap-2 text-emerald-600 dark:text-emerald-400"
                            >
                              <Power className="size-3.5" /> Reactivate Workspace
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProvisionTenantDialog open={provisionOpen} onOpenChange={setProvisionOpen} />

      {/* Suspend Confirmation Dialog */}
      <Dialog open={Boolean(suspendTarget)} onOpenChange={() => setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="size-5" /> Suspend Tenant Organization
            </DialogTitle>
            <DialogDescription>
              Suspending <strong>{suspendTarget?.name}</strong> will immediately block member access
              across API gateways and WebSocket connections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason" className="text-xs font-semibold">
              Reason for Suspension (Recorded in Audit Trail)
            </Label>
            <Textarea
              id="suspend-reason"
              placeholder="e.g. Terms of Service violation, overdue invoices, or customer dispute"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e?.target?.value ?? "")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendReason.trim() || isSuspending}
            >
              {isSuspending ? "Suspending…" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog open={Boolean(activateTarget)} onOpenChange={() => setActivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" /> Reactivate Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore active status for{" "}
              <strong>{activateTarget?.name}</strong>? Member login and API traffic will resume.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateTarget(null)}>
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
      <Dialog open={Boolean(supportTarget)} onOpenChange={() => setSupportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <LifeBuoy className="size-5" /> Start Audited Support Delegation
            </DialogTitle>
            <DialogDescription>
              Initiate a 30-minute time-bound troubleshooting delegation for{" "}
              <strong>{supportTarget?.name}</strong>. All operator actions will be logged in
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
              value={supportReason}
              onChange={(e) => setSupportReason(e?.target?.value ?? "")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSupport}
              disabled={!supportReason.trim() || isStartingSupport}
            >
              {isStartingSupport ? "Starting Delegation…" : "Start Support Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
