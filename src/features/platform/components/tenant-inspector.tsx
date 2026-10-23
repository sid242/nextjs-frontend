"use client";

import { useState } from "react";
import Link from "next/link";
import {
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
  ShieldAlert,
  Users,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  useActivateTenant,
  usePlatformTenant,
  useStartSupportSession,
  useSuspendTenant,
  useUpdatePlatformTenantSubscription,
} from "../queries";

interface TenantInspectorProps {
  tenantId: string;
}

export function TenantInspector({ tenantId }: TenantInspectorProps) {
  const { data: tenant, isLoading } = usePlatformTenant(tenantId);
  const { mutateAsync: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutateAsync: activateTenant, isPending: isActivating } = useActivateTenant();
  const { mutateAsync: updateSubscription, isPending: isUpdatingSub } =
    useUpdatePlatformTenantSubscription(tenantId);
  const { mutateAsync: startSupportSession, isPending: isStartingSupport } =
    useStartSupportSession();

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportReason, setSupportReason] = useState("");

  const [editSeatsOpen, setEditSeatsOpen] = useState(false);
  const [newSeatCount, setNewSeatCount] = useState<number>(tenant?.subscription?.seatCount ?? 5);

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
    if (!suspendReason.trim()) return;
    try {
      await suspendTenant({ id: tenant.id, reason: suspendReason.trim() });
      setSuspendOpen(false);
      setSuspendReason("");
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

  const handleStartSupport = async () => {
    if (!supportReason.trim()) return;
    try {
      await startSupportSession({
        tenantId: tenant.id,
        reason: supportReason.trim(),
        durationMinutes: 30,
      });
      setSupportOpen(false);
      setSupportReason("");
    } catch {
      /* handled */
    }
  };

  const handleSaveSeats = async () => {
    try {
      await updateSubscription({ seatCount: Number(newSeatCount) });
      setEditSeatsOpen(false);
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
            onClick={() => setSupportOpen(true)}
            className="gap-2 shadow-xs"
          >
            <LifeBuoy className="size-4 text-blue-500" />
            Support Session
          </Button>

          {tenant.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              onClick={() => setSuspendOpen(true)}
              className="gap-2 shadow-xs"
            >
              <PowerOff className="size-4" />
              Suspend Workspace
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="gap-2 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
            >
              <Power className="size-4" />
              {isActivating ? "Reactivating…" : "Reactivate Workspace"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Organization Overview */}
        <Card className="shadow-xs lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="text-primary size-4" /> Organization Details
            </CardTitle>
            <CardDescription className="text-xs">
              Database routing pool, tenant contact, and membership telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
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
            </div>

            <div className="rounded-lg border p-3">
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

            <div className="rounded-lg border p-3">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Creation & Provisioning
              </span>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <Clock className="text-muted-foreground size-3.5" />
                <span>{new Date(tenant.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-lg border p-3">
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
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="text-primary size-4" /> Subscription & Tier
            </CardTitle>
            <CardDescription className="text-xs">
              Monetization plan, seat quotas, and billing status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
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

            <div className="flex items-center justify-between rounded-lg border p-3">
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
                onClick={() => {
                  setNewSeatCount(tenant.subscription?.seatCount ?? 5);
                  setEditSeatsOpen(true);
                }}
              >
                Change Seats
              </Button>
            </div>

            {tenant.subscription?.trialEndsAt && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Trial Window Active
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Ends on {new Date(tenant.subscription.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* White-Label Branding Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Palette className="text-primary size-4" /> White-Label Brand Tokens
          </CardTitle>
          <CardDescription className="text-xs">
            Visual tokens, logos, and custom accent colors configured by this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Brand Display Name
            </span>
            <div className="mt-1 text-sm font-semibold">
              {tenant.branding?.companyName ?? tenant.name}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Primary Brand Color
            </span>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="size-4 rounded-full border"
                style={{ backgroundColor: tenant.branding?.primaryColor ?? "#4F46E5" }}
              />
              <span className="font-mono text-xs">
                {tenant.branding?.primaryColor ?? "#4F46E5"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">
              Support Contact
            </span>
            <div className="mt-1 text-xs">
              {tenant.branding?.supportEmail ?? "system@domain.com (Default)"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="size-5" /> Suspend Tenant Organization
            </DialogTitle>
            <DialogDescription>
              Suspending <strong>{tenant.name}</strong> immediately revokes member sessions and
              blocks HTTP and WebSocket traffic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason" className="text-xs font-semibold">
              Reason for Suspension (Recorded in Audit Trail)
            </Label>
            <Textarea
              id="suspend-reason"
              placeholder="e.g. Terms of Service violation, overdue invoices, or security investigation"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e?.target?.value ?? "")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
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

      {/* Support Session Dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <LifeBuoy className="size-5" /> Initiate Support Delegation
            </DialogTitle>
            <DialogDescription>
              Start an audited 30-minute troubleshooting session for <strong>{tenant.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="support-reason" className="text-xs font-semibold">
              Delegation Reason
            </Label>
            <Textarea
              id="support-reason"
              placeholder="e.g. Troubleshooting customer dashboard and RBAC permission mismatch"
              value={supportReason}
              onChange={(e) => setSupportReason(e?.target?.value ?? "")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(false)}>
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

      {/* Edit Seats Dialog */}
      <Dialog open={editSeatsOpen} onOpenChange={setEditSeatsOpen}>
        <DialogContent>
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
              value={newSeatCount}
              onChange={(e) => setNewSeatCount(Number(e?.target?.value ?? 1))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSeatsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSeats} disabled={isUpdatingSub}>
              {isUpdatingSub ? "Saving…" : "Save Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
