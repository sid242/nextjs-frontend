"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  LifeBuoy,
  Plus,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

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
import { usePlatformPlans, type Plan } from "@/features/plans";

import {
  usePlatformAuditLogs,
  usePlatformTenants,
  useStaffList,
  useSupportSessions,
} from "../queries";
import type {
  PlatformAuditLog,
  PlatformSupportSession,
  PlatformTenant,
  StaffMember,
} from "../schemas";

export function PlatformDashboard() {
  const { data: tenantsData, isLoading: isTenantsLoading } = usePlatformTenants({ limit: 100 });
  const { data: staffData, isLoading: isStaffLoading } = useStaffList({ limit: 100 });
  const { data: plans = [], isLoading: isPlansLoading } = usePlatformPlans({
    includeInactive: true,
  });
  const { data: sessionsData, isLoading: isSessionsLoading } = useSupportSessions({ limit: 10 });
  const { data: auditData, isLoading: isAuditLoading } = usePlatformAuditLogs({ limit: 6 });

  const tenantsList: PlatformTenant[] = tenantsData?.items ?? [];
  const activeTenants = tenantsList.filter((t: PlatformTenant) => t?.status === "ACTIVE").length;
  const suspendedTenants = tenantsList.filter(
    (t: PlatformTenant) => t?.status === "SUSPENDED",
  ).length;

  const staffList: StaffMember[] = staffData?.items ?? [];
  const activeStaff = staffList.filter((s: StaffMember) => s?.status === "ACTIVE").length;

  const planList: Plan[] = plans ?? [];
  const activePlans = planList.filter((p: Plan) => p?.isActive).length;

  const sessionList: PlatformSupportSession[] = sessionsData?.items ?? [];
  const activeSessions = sessionList.filter(
    (s: PlatformSupportSession) => s?.status === "ACTIVE",
  ).length;

  const recentLogs: PlatformAuditLog[] = auditData?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Platform Operations Control Plane</h1>
          <p className="text-muted-foreground text-xs">
            Real-time telemetry, multi-tenant workspace provisioning, and security compliance
            overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
            <Link href="/platform/support-sessions">
              <LifeBuoy className="h-3.5 w-3.5" /> Start Support Session
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs shadow-sm">
            <Link href="/platform/tenants/new">
              <Plus className="h-3.5 w-3.5" /> Provision Workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Workspaces Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-mono text-xs uppercase">Workspaces</CardDescription>
              <Building2 className="text-muted-foreground/60 h-4 w-4" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isTenantsLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                (tenantsData?.total ?? tenantsList.length)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> {activeTenants} active
              </span>
              {suspendedTenants > 0 ? (
                <span className="text-destructive flex items-center gap-1 font-medium">
                  <ShieldAlert className="h-3 w-3" /> {suspendedTenants} suspended
                </span>
              ) : null}
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-[11px]">
              <Link href="/platform/tenants" className="inline-flex items-center gap-1">
                Inspect workspaces <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Staff Operators Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-mono text-xs uppercase">
                Platform Staff
              </CardDescription>
              <Users className="text-muted-foreground/60 h-4 w-4" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isStaffLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                (staffData?.total ?? staffList.length)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-xs">
            <div className="text-muted-foreground flex items-center justify-between">
              <span>{activeStaff} active accounts</span>
              <span className="font-medium text-blue-500">Internal Operators</span>
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-[11px]">
              <Link href="/platform/staff" className="inline-flex items-center gap-1">
                Manage staff <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Commercial Plans Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-mono text-xs uppercase">SaaS Tiers</CardDescription>
              <Layers className="text-muted-foreground/60 h-4 w-4" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isPlansLoading ? <Skeleton className="h-7 w-12" /> : planList.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-xs">
            <div className="text-muted-foreground flex items-center justify-between">
              <span className="font-medium text-emerald-500">
                {activePlans} active public tiers
              </span>
              <span>{planList.length - activePlans} inactive</span>
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-[11px]">
              <Link href="/platform/plans" className="inline-flex items-center gap-1">
                Configure pricing <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Support Sessions Card */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-mono text-xs uppercase">
                Support Sessions
              </CardDescription>
              <LifeBuoy className="text-muted-foreground/60 h-4 w-4" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSessionsLoading ? <Skeleton className="h-7 w-12" /> : activeSessions}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-xs">
            <div className="text-muted-foreground flex items-center justify-between">
              <span>{activeSessions > 0 ? "Active delegation" : "No active sessions"}</span>
              <span className="font-mono text-[10px]">TIME-BOUND</span>
            </div>
            <Button asChild variant="link" size="sm" className="h-auto p-0 text-[11px]">
              <Link href="/platform/support-sessions" className="inline-flex items-center gap-1">
                View session log <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Infrastructure Status + Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System & Architecture Health */}
        <Card className="border-border/80 shadow-xs lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-emerald-500" /> Infrastructure Nodes
              </CardTitle>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-[10px] text-emerald-500"
              >
                HEALTHY
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Backend cluster & scalable foundation services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-xs">
              <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Server className="text-primary h-4 w-4" />
                  <div>
                    <div className="font-medium">Express API Gateway</div>
                    <div className="text-muted-foreground text-[10px]">
                      Port 3001 &bull; ECS Fargate
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  OPERATIONAL
                </Badge>
              </div>

              <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="font-medium">BullMQ Worker Process</div>
                    <div className="text-muted-foreground text-[10px]">
                      Async jobs & cron schedulers
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  RUNNING
                </Badge>
              </div>

              <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">PostgreSQL Master</div>
                    <div className="text-muted-foreground text-[10px]">
                      Drizzle ORM &bull; Connection pool
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  CONNECTED
                </Badge>
              </div>

              <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Redis In-Memory Bus</div>
                    <div className="text-muted-foreground text-[10px]">
                      Cache-aside & Socket.IO adapter
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  READY
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Platform Audit Trail */}
        <Card className="border-border/80 shadow-xs lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="text-primary h-4 w-4" /> Recent Operator Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Immutable security events and administrative actions across all domains
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Link href="/platform/audit-logs">
                  All Logs <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isAuditLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-xs">
                No platform audit events recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="font-mono text-[11px] uppercase">
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {recentLogs.map((log: PlatformAuditLog) => (
                    <TableRow key={log?.id}>
                      <TableCell className="font-medium">
                        <div className="text-foreground">{log?.staffDisplayName ?? "Operator"}</div>
                        <div className="text-muted-foreground font-mono text-[10px]">
                          {log?.staffEmail ?? "System"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {log?.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {log?.targetType
                          ? `${log.targetType} (${log?.targetId?.slice(0, 8) ?? ""})`
                          : "Global"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono text-[11px]">
                        {log?.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
