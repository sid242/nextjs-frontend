"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Building2,
  Clock,
  Database,
  Globe,
  Layers,
  LifeBuoy,
  Palette,
  Power,
  PowerOff,
  Users,
  VenetianMask,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TenantLogo } from "@/features/tenants";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  useActivateTenant,
  useMigrateTenantDatabase,
  usePlatformTenant,
  usePlatformTenantMembers,
  useRollbackTenantDatabase,
  useStartSupportSession,
  useSuspendTenant,
  useTenantDbHealth,
  useUpdatePlatformTenantSubscription,
} from "../queries";
import type { PlatformTenantMember } from "../schemas";

interface TenantInspectorProps {
  tenantId: string;
}

export function TenantInspector({ tenantId }: TenantInspectorProps) {
  const { data: tenant, isLoading } = usePlatformTenant(tenantId);
  const { data: members, isLoading: isLoadingMembers } = usePlatformTenantMembers(tenantId);
  const { mutateAsync: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutateAsync: activateTenant, isPending: isActivating } = useActivateTenant();
  const { mutateAsync: updateSubscription, isPending: isUpdatingSub } =
    useUpdatePlatformTenantSubscription(tenantId);
  const { mutateAsync: startSupportSession, isPending: isStartingSupport } =
    useStartSupportSession();
  const { mutateAsync: migrateTenantDb, isPending: isMigratingDb } =
    useMigrateTenantDatabase(tenantId);
  const { mutateAsync: rollbackTenantDb, isPending: isRollingBackDb } =
    useRollbackTenantDatabase(tenantId);
  const [healthChecked, setHealthChecked] = useState(false);
  const {
    data: dbHealth,
    isFetching: isCheckingHealth,
    refetch: refetchHealth,
  } = useTenantDbHealth(tenantId, healthChecked);
  const [customDbName, setCustomDbName] = useState("");

  const [modalState, setModalState] = useState<{
    type: "suspend" | "support" | "editSeats" | "migrateDb" | "rollbackDb" | null;
    reason: string;
    targetMember: PlatformTenantMember | null;
    seatCount: number;
  }>({
    type: null,
    reason: "",
    targetMember: null,
    seatCount: 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">Tenant Workspace Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested organization ID does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/platform/tenants">
            <ArrowLeft className="mr-2 size-4" /> Back to Workspaces
          </Link>
        </Button>
      </div>
    );
  }

  const handleSuspend = async () => {
    if (!modalState.reason.trim()) return;
    try {
      await suspendTenant({ id: tenant.id, reason: modalState.reason.trim() });
      setModalState({ type: null, reason: "", targetMember: null, seatCount: 5 });
    } catch {
      /* handled */
    }
  };

  const handleActivate = async () => {
    try {
      await activateTenant({ id: tenant.id, reason: "Reactivated by operator" });
    } catch {
      /* handled */
    }
  };

  const handleOpenGeneralSupport = () => {
    setModalState({
      type: "support",
      reason: `Troubleshooting tenant workspace for ${tenant.name}`,
      targetMember: null,
      seatCount: tenant?.subscription?.seatCount ?? 5,
    });
  };

  const handleOpenMemberSupport = (member: PlatformTenantMember) => {
    setModalState({
      type: "support",
      reason: `Troubleshooting customer user session for ${member.name ?? member.email}`,
      targetMember: member,
      seatCount: tenant?.subscription?.seatCount ?? 5,
    });
  };

  const handleStartSupport = async () => {
    if (!modalState.reason.trim()) return;
    try {
      const res = await startSupportSession({
        tenantId: tenant.id,
        targetUserId: modalState.targetMember?.userId,
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

        toast.success(
          `Entering ${tenant.name} as ${modalState.targetMember?.name ?? modalState.targetMember?.email ?? "tenant user"}…`,
        );

        setModalState({ type: null, reason: "", targetMember: null, seatCount: 5 });

        // Full page navigation into the tenant dashboard with support banner active!
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to start support session"));
    }
  };

  const handleCheckHealth = async () => {
    setHealthChecked(true);
    try {
      const res = await refetchHealth();
      if (res?.data?.healthy) {
        toast.success(`Database connected (${res.data.latencyMs}ms)`);
      } else {
        toast.error(`Database check failed: ${res?.data?.error ?? "Unreachable"}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleMigrateToDedicated = async () => {
    try {
      const result = await migrateTenantDb({
        customDatabaseName: customDbName.trim() ? customDbName.trim() : undefined,
      });
      toast.success(
        `Workspace migrated to dedicated database: ${result?.databaseName ?? "dedicated"}`,
      );
      setModalState((prev) => ({ ...prev, type: null }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRollbackToShared = async () => {
    try {
      await rollbackTenantDb();
      toast.success("Workspace successfully rolled back to shared database cluster");
      setModalState((prev) => ({ ...prev, type: null }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveSeats = async () => {
    try {
      await updateSubscription({ seatCount: Number(modalState.seatCount) });
      setModalState((prev) => ({ ...prev, type: null }));
    } catch {
      /* handled */
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-9 shrink-0">
            <Link href="/platform/tenants">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight">{tenant.name}</h1>
              {tenant.status === "ACTIVE" && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  Active
                </Badge>
              )}
              {tenant.status === "SUSPENDED" && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  Suspended
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              ID: {tenant.id} &bull; Slug: {tenant.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenGeneralSupport}
            className="h-10 gap-2 rounded-xl shadow-xs"
          >
            <LifeBuoy className="size-4 text-blue-500" />
            Support Session
          </Button>

          {tenant.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              onClick={() => setModalState((prev) => ({ ...prev, type: "suspend" }))}
              className="h-10 gap-2 rounded-xl shadow-xs"
            >
              <PowerOff className="size-4" />
              Suspend Workspace
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="h-10 gap-2 rounded-xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
            >
              <Power className="size-4" />
              {isActivating ? "Reactivating…" : "Reactivate Workspace"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Organization Overview */}
        <Card className="border-border/80 rounded-2xl shadow-xs lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="text-primary size-4" /> Organization Details
            </CardTitle>
            <CardDescription className="text-xs">
              Database routing pool, tenant contact, and membership telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="border-border/70 rounded-xl border p-3">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Database Architecture
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Database className="size-4 text-indigo-500" />
                <span className="text-sm font-semibold capitalize">{tenant.databaseMode} Mode</span>
                <Badge variant="secondary" className="text-[10px]">
                  v{tenant.schemaVersion ?? "1.0.0"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {tenant.databaseMode === "dedicated"
                  ? "Enterprise isolated database schema"
                  : "Shared PostgreSQL with tenantId isolation"}
              </p>

              <div className="border-border/50 mt-2.5 flex flex-wrap items-center gap-2 border-t pt-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 rounded-lg text-[11px]"
                  disabled={isCheckingHealth}
                  onClick={handleCheckHealth}
                >
                  <Activity className="size-3 text-emerald-500" />
                  {isCheckingHealth ? "Checking…" : "Check Health"}
                </Button>

                {tenant.databaseMode === "shared" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 rounded-lg border-indigo-500/30 text-[11px] text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400"
                    onClick={() => {
                      setCustomDbName(`tenant_${tenant.slug.replace(/[^a-z0-9_]/g, "_")}`);
                      setModalState((prev) => ({ ...prev, type: "migrateDb" }));
                    }}
                  >
                    <Database className="size-3 text-indigo-500" />
                    Migrate to Dedicated
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 rounded-lg border-amber-500/30 text-[11px] text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                    onClick={() => setModalState((prev) => ({ ...prev, type: "rollbackDb" }))}
                  >
                    <Database className="size-3 text-amber-500" />
                    Rollback to Shared
                  </Button>
                )}

                {dbHealth && (
                  <span className="text-muted-foreground font-mono text-[10px]">
                    Ping: {dbHealth.latencyMs}ms ({dbHealth.databaseMode})
                  </span>
                )}
              </div>
            </div>

            <div className="border-border/70 rounded-xl border p-3">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Active Member Roster
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Users className="text-primary size-4" />
                <span className="text-sm font-semibold">{tenant.memberCount} Members</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Primary Owner: {tenant.ownerEmail ?? "Unassigned"}
              </p>
            </div>

            <div className="border-border/70 rounded-xl border p-3">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Creation & Provisioning
              </span>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <Clock className="text-muted-foreground size-3.5" />
                <span>{formatDate(tenant?.createdAt)}</span>
              </div>
            </div>

            <div className="border-border/70 rounded-xl border p-3">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Custom Domain Resolution
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Globe className="text-muted-foreground size-3.5" />
                <span className="font-mono text-xs">
                  {tenant.branding?.customDomain ? `${tenant.branding.customDomain}` : "None"}
                </span>
                {tenant.branding?.customDomain && (
                  <Badge variant="outline" className="text-[10px]">
                    {tenant.branding.customDomainStatus ?? "PENDING"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Entitlements Card */}
        <Card className="border-border/80 rounded-2xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="text-primary size-4" /> Subscription & Tier
            </CardTitle>
            <CardDescription className="text-xs">
              Monetization plan, seat quotas, and billing status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-border/70 flex items-center justify-between rounded-xl border p-3">
              <div>
                <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Current Plan
                </span>
                <div className="text-base font-bold">{tenant.plan}</div>
              </div>
              <Badge variant="secondary" className="font-mono">
                {tenant.subscription?.status ?? "ACTIVE"}
              </Badge>
            </div>

            <div className="border-border/70 flex items-center justify-between rounded-xl border p-3">
              <div>
                <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                  Seat Capacity
                </span>
                <div className="text-base font-bold">
                  {tenant.subscription?.seatCount ?? 5} Seats
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => {
                  setModalState((prev) => ({
                    ...prev,
                    type: "editSeats",
                    seatCount: tenant.subscription?.seatCount ?? 5,
                  }));
                }}
              >
                Change Seats
              </Button>
            </div>

            {tenant.subscription?.trialEndsAt && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Trial Window Active
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Ends on {formatDate(tenant.subscription.trialEndsAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Members & Audited Impersonation Card */}
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="text-primary size-4" /> Tenant Members & Impersonation
            </CardTitle>
            <CardDescription className="text-xs">
              Select any customer organization member to initiate an audited support session and
              view their exact dashboard through their permissions.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {members?.length ?? 0} {members?.length === 1 ? "Member" : "Members"}
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (members?.length ?? 0) === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-xs">
              No members found in this tenant workspace.
            </div>
          ) : (
            <div className="border-border/70 w-full overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Member</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Joined</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-[11px] font-semibold">
                              {initials(member.name ?? member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {member.name ?? "Unnamed Member"}
                            </span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] font-semibold uppercase",
                            member.roleName.toLowerCase() === "owner" &&
                              "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
                            member.roleName.toLowerCase() === "admin" &&
                              "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            member.roleName.toLowerCase() === "member" &&
                              "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
                          )}
                        >
                          {member.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            member.status === "ACTIVE" &&
                              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            member.status === "INVITED" &&
                              "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            member.status === "SUSPENDED" &&
                              "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
                          )}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(member.joinedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenMemberSupport(member)}
                          className="hover:border-primary/50 h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-2xs"
                        >
                          <VenetianMask className="text-primary size-3.5" />
                          Impersonate User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* White-Label Branding Card */}
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Palette className="text-primary size-4" /> White-Label Brand Tokens
          </CardTitle>
          <CardDescription className="text-xs">
            Visual tokens, logos, and custom accent colors configured by this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="border-border/70 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Brand Identity & Logo
            </span>
            <div className="mt-1 flex items-center gap-2">
              <TenantLogo
                variant="full"
                branding={tenant.branding}
                tenant={{
                  id: tenant.id,
                  name: tenant.name,
                  slug: tenant.slug,
                  plan: tenant.plan,
                  status: tenant.status,
                  createdAt: tenant.createdAt,
                }}
                showName
              />
            </div>
          </div>

          <div className="border-border/70 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Primary & Accent Colors
            </span>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className="size-4 rounded-full border shadow-2xs"
                  style={{ backgroundColor: tenant.branding?.primaryColor ?? "#4F46E5" }}
                  title="Primary Color"
                />
                <span className="font-mono text-xs">
                  {tenant.branding?.primaryColor ?? "#4F46E5"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="size-4 rounded-full border shadow-2xs"
                  style={{ backgroundColor: tenant.branding?.accentColor ?? "#06B6D4" }}
                  title="Accent Color"
                />
                <span className="font-mono text-xs">
                  {tenant.branding?.accentColor ?? "#06B6D4"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-border/70 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Border Radius Curvature
            </span>
            <div className="mt-1 font-mono text-xs">
              {tenant.branding?.borderRadius ?? "0.5rem"}
            </div>
          </div>

          <div className="border-border/70 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Support Communication Email
            </span>
            <div className="mt-1 font-mono text-xs">
              {tenant.branding?.supportEmail ?? "system-default@platform.io"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Confirmation Dialog */}
      <Dialog
        open={modalState.type === "suspend"}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, type: open ? "suspend" : null }))
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <PowerOff className="size-5" /> Suspend Customer Workspace
            </DialogTitle>
            <DialogDescription>
              Disabling <strong>{tenant.name}</strong> immediately cuts off all user access and
              tenant API operations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason" className="text-xs font-semibold">
              Reason for Administrative Suspension
            </Label>
            <Textarea
              id="suspend-reason"
              placeholder="e.g. Terms of Service violation, overdue invoices, or security investigation"
              value={modalState.reason}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, reason: e?.target?.value ?? "" }))
              }
              rows={3}
              className="rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setModalState((prev) => ({ ...prev, type: null }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10 rounded-xl"
              onClick={handleSuspend}
              disabled={!modalState.reason.trim() || isSuspending}
            >
              {isSuspending ? "Suspending…" : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Session Dialog */}
      <Dialog
        open={modalState.type === "support"}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, type: open ? "support" : null }))
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <LifeBuoy className="size-5" /> Initiate Audited Support Session
            </DialogTitle>
            <DialogDescription>
              {modalState.targetMember ? (
                <span>
                  Enter workspace <strong>{tenant.name}</strong> impersonating member{" "}
                  <strong className="text-foreground">
                    {modalState.targetMember.name ?? modalState.targetMember.email}
                  </strong>{" "}
                  ({modalState.targetMember.roleName}).
                </span>
              ) : (
                <span>
                  Start an audited 30-minute troubleshooting session for{" "}
                  <strong>{tenant.name}</strong>.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="support-reason" className="text-xs font-semibold">
              Delegation Reason (Compliance Audited)
            </Label>
            <Textarea
              id="support-reason"
              placeholder="e.g. Troubleshooting customer dashboard and RBAC permission mismatch"
              value={modalState.reason}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, reason: e?.target?.value ?? "" }))
              }
              rows={3}
              className="rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setModalState((prev) => ({ ...prev, type: null }))}
            >
              Cancel
            </Button>
            <Button
              className="h-10 rounded-xl"
              onClick={handleStartSupport}
              disabled={!modalState.reason.trim() || isStartingSupport}
            >
              {isStartingSupport
                ? "Starting Session…"
                : modalState.targetMember
                  ? "Impersonate & Enter Dashboard"
                  : "Start Support Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migrate to Dedicated Database Dialog */}
      <Dialog
        open={modalState.type === "migrateDb"}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, type: open ? "migrateDb" : null }))
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-5 text-indigo-500" /> Migrate to Dedicated Database
            </DialogTitle>
            <DialogDescription>
              Provisions an isolated PostgreSQL database, migrates all tenant data (members,
              subscriptions, invoices, branding), and switches database routing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="custom-db-name" className="text-xs font-semibold">
                Database Name
              </Label>
              <Input
                id="custom-db-name"
                value={customDbName}
                onChange={(e) => setCustomDbName(e?.target?.value ?? "")}
                className="h-10 rounded-xl font-mono text-xs"
                placeholder="tenant_custom_name"
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Must start with a letter/underscore and contain 2-63 alphanumeric characters.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setModalState((prev) => ({ ...prev, type: null }))}
              disabled={isMigratingDb}
            >
              Cancel
            </Button>
            <Button
              className="h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleMigrateToDedicated}
              disabled={isMigratingDb}
            >
              {isMigratingDb ? "Provisioning & Migrating…" : "Start Migration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback to Shared Database Dialog */}
      <Dialog
        open={modalState.type === "rollbackDb"}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, type: open ? "rollbackDb" : null }))
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-5 text-amber-500" /> Rollback to Shared Database
            </DialogTitle>
            <DialogDescription>
              Switches tenant database routing back to the primary shared PostgreSQL cluster. The
              dedicated database will be preserved for the retention window.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setModalState((prev) => ({ ...prev, type: null }))}
              disabled={isRollingBackDb}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10 rounded-xl"
              onClick={handleRollbackToShared}
              disabled={isRollingBackDb}
            >
              {isRollingBackDb ? "Rolling back…" : "Confirm Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seats Dialog */}
      <Dialog
        open={modalState.type === "editSeats"}
        onOpenChange={(open) =>
          setModalState((prev) => ({ ...prev, type: open ? "editSeats" : null }))
        }
      >
        <DialogContent className="border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>Update Seat Allocation</DialogTitle>
            <DialogDescription>
              Override maximum member seat quota for this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="seats-input" className="text-xs font-semibold">
              Total Allowed Seats
            </Label>
            <Input
              id="seats-input"
              type="number"
              min={1}
              max={1000}
              value={modalState.seatCount}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, seatCount: Number(e?.target?.value ?? 1) }))
              }
              className="h-10 rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setModalState((prev) => ({ ...prev, type: null }))}
            >
              Cancel
            </Button>
            <Button className="h-10 rounded-xl" onClick={handleSaveSeats} disabled={isUpdatingSub}>
              {isUpdatingSub ? "Saving…" : "Save Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
