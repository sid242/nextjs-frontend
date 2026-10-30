"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Lock, Plus, Search, Shield, ShieldCheck, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { PLATFORM_PERMISSION_KEYS } from "../permissions";
import { usePlatformPermissions, usePlatformRoles } from "../queries";
import type { PlatformPermission, PlatformRole } from "../schemas";
import { PlatformPermissionGate } from "./platform-permission-gate";

function PermissionActionChip({ action }: { action: string }) {
  const act = action.toUpperCase();
  if (act.includes("READ") || act.includes("VIEW") || act.includes("LIST")) {
    return (
      <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
        {action}
      </span>
    );
  }
  if (act.includes("CREATE") || act.includes("WRITE") || act.includes("PROVISION")) {
    return (
      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
        {action}
      </span>
    );
  }
  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("STATUS")) {
    return (
      <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
        {action}
      </span>
    );
  }
  if (act.includes("DELETE") || act.includes("REVOKE") || act.includes("PURGE")) {
    return (
      <span className="rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
        {action}
      </span>
    );
  }
  return (
    <span className="rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400">
      {action}
    </span>
  );
}

export function RolesMatrix() {
  const { data: roles = [], isLoading: rolesLoading } = usePlatformRoles();
  const { data: permissions = [], isLoading: permsLoading } = usePlatformPermissions();

  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const [permSearch, setPermSearch] = useState("");
  const [permStatusFilter, setPermStatusFilter] = useState<"ALL" | "GRANTED" | "UNGRANTED">("ALL");

  // Active role for details inspection
  const activeRole = useMemo(() => {
    if (selectedRole && roles.some((r) => r.id === selectedRole.id)) {
      return roles.find((r) => r.id === selectedRole.id) ?? roles[0] ?? null;
    }
    return roles[0] ?? null;
  }, [roles, selectedRole]);

  // Filtered roles list on left
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        !roleSearch ||
        role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        role.key.toLowerCase().includes(roleSearch.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(roleSearch.toLowerCase()));

      const matchesType =
        roleTypeFilter === "ALL" ||
        (roleTypeFilter === "SYSTEM" && role.isSystem) ||
        (roleTypeFilter === "CUSTOM" && !role.isSystem);

      return matchesSearch && matchesType;
    });
  }, [roles, roleSearch, roleTypeFilter]);

  // Group permissions by resource with search & grant filters
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PlatformPermission[]> = {};
    if (!activeRole) return groups;

    const hasWildcard = activeRole.permissions.includes("*");

    for (const perm of permissions) {
      const isGranted = hasWildcard || activeRole.permissions.includes(perm.key);

      // Status filter
      if (permStatusFilter === "GRANTED" && !isGranted) continue;
      if (permStatusFilter === "UNGRANTED" && isGranted) continue;

      // Text search
      if (
        permSearch &&
        !perm.name.toLowerCase().includes(permSearch.toLowerCase()) &&
        !perm.key.toLowerCase().includes(permSearch.toLowerCase()) &&
        !perm.resource.toLowerCase().includes(permSearch.toLowerCase()) &&
        !perm.action.toLowerCase().includes(permSearch.toLowerCase())
      ) {
        continue;
      }

      if (!groups[perm.resource]) {
        groups[perm.resource] = [];
      }
      groups[perm.resource]!.push(perm);
    }
    return groups;
  }, [permissions, activeRole, permSearch, permStatusFilter]);

  const totalPermsCount = permissions.length;
  const grantedCount = useMemo(() => {
    if (!activeRole) return 0;
    if (activeRole.permissions.includes("*")) return totalPermsCount;
    return activeRole.permissions.filter((k) => permissions.some((p) => p.key === k)).length;
  }, [activeRole, permissions, totalPermsCount]);

  const grantedPercentage =
    totalPermsCount > 0 ? Math.round((grantedCount / totalPermsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Platform Roles &amp; Permissions Matrix
          </h1>
          <p className="text-muted-foreground text-xs">
            Canonical <code>resource::action</code> catalog governing administrative SaaS
            operations, privilege boundaries, and staff assignments.
          </p>
        </div>
        <PlatformPermissionGate
          permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}
          hideInsteadOfBanner
        >
          <Button asChild size="sm" className="h-9 gap-2 rounded-xl text-xs shadow-xs">
            <Link href="/platform/roles/new">
              <Plus className="size-3.5" />
              Create Custom Platform Role
            </Link>
          </Button>
        </PlatformPermissionGate>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase">
              Total Staff Roles
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold">
              {roles.length}
              <Shield className="text-muted-foreground/60 size-5" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-blue-600 uppercase dark:text-blue-400">
              System Immutable
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-blue-600 dark:text-blue-400">
              {roles.filter((r) => r.isSystem).length}
              <Lock className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-emerald-600 uppercase dark:text-emerald-400">
              Custom Operational
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {roles.filter((r) => !r.isSystem).length}
              <Sparkles className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs text-purple-600 uppercase dark:text-purple-400">
              Canonical Scopes
            </CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalPermsCount} Actions
              <ShieldCheck className="size-5 opacity-70" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {rolesLoading || permsLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-4" />
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Roles Selector Column (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground font-mono text-xs font-semibold tracking-wider uppercase">
                Staff Roles ({filteredRoles.length})
              </h2>
              {/* Type Filter Chips */}
              <div className="flex items-center gap-1">
                {(["ALL", "SYSTEM", "CUSTOM"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRoleTypeFilter(t)}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[9px] transition-all",
                      roleTypeFilter === t
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Search Box */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Search roles by name or key…"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e?.target?.value ?? "")}
                className="h-8 pl-8.5 text-xs"
              />
              {roleSearch && (
                <button
                  type="button"
                  onClick={() => setRoleSearch("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Role Cards List */}
            <div className="space-y-2">
              {filteredRoles.map((role) => {
                const isSelected = activeRole?.id === role.id;
                const isWildcard = role.permissions.includes("*");
                const rolePermCount = isWildcard ? totalPermsCount : role.permissions.length;
                const percent =
                  totalPermsCount > 0 ? Math.round((rolePermCount / totalPermsCount) * 100) : 0;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "relative w-full overflow-hidden rounded-2xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "bg-card border-primary ring-primary/40 shadow-xs ring-1"
                        : "bg-card/40 border-border/80 hover:bg-card/90 hover:border-border",
                    )}
                  >
                    {isSelected && (
                      <div className="bg-primary absolute top-0 bottom-0 left-0 w-1" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border/60",
                          )}
                        >
                          {role.isSystem ? (
                            <Lock className="size-3.5" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-foreground block truncate text-xs font-semibold tracking-tight">
                            {role.name}
                          </span>
                          <span className="text-muted-foreground block truncate font-mono text-[10px]">
                            {role.key}
                          </span>
                        </div>
                      </div>

                      {role.isSystem ? (
                        <Badge
                          variant="outline"
                          className="border-muted shrink-0 px-1.5 py-0 font-mono text-[9px]"
                        >
                          SYSTEM
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="shrink-0 px-1.5 py-0 font-mono text-[9px]"
                        >
                          CUSTOM
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mt-2 line-clamp-1 text-[11px]">
                      {role.description ?? "Operational staff role"}
                    </p>

                    {/* Permission Cap Bar */}
                    <div className="border-border/40 mt-2.5 flex items-center justify-between gap-2 border-t pt-2">
                      <div className="text-muted-foreground font-mono text-[10px]">
                        <span>{rolePermCount} scopes</span>
                        <span className="mx-1">&bull;</span>
                        <span>{percent}% access</span>
                      </div>
                      <div className="bg-muted h-1.5 w-16 shrink-0 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            percent === 100
                              ? "bg-purple-500"
                              : percent > 50
                                ? "bg-primary"
                                : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(100, Math.max(8, percent))}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredRoles.length === 0 && (
                <div className="text-muted-foreground border-border/60 rounded-xl border border-dashed p-6 text-center text-xs">
                  No roles match your filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* Role Detail & Permission Matrix Column (8 cols) */}
          <div className="lg:col-span-8">
            {activeRole ? (
              <Card className="border-border/80 bg-card/60 rounded-2xl shadow-xs">
                {/* Header */}
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-foreground text-lg font-bold tracking-tight">
                          {activeRole.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary font-mono text-xs"
                        >
                          {activeRole.key}
                        </Badge>
                        {activeRole.isSystem ? (
                          <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                            <Lock className="size-2.5" /> System Immutable
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            Editable Role
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {activeRole.description ??
                          "Custom role granted specific canonical privileges."}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {!activeRole.isSystem && (
                        <PlatformPermissionGate
                          permission={PLATFORM_PERMISSION_KEYS.ROLES_MANAGE}
                          hideInsteadOfBanner
                        >
                          <Button asChild size="sm" className="h-8 gap-1.5 text-xs shadow-xs">
                            <Link href={`/platform/roles/${activeRole.id}/edit`}>
                              Edit Role Scopes
                            </Link>
                          </Button>
                        </PlatformPermissionGate>
                      )}
                    </div>
                  </div>

                  {/* Scopes Progress Bar & Filters */}
                  <div className="border-border/40 mt-4 space-y-3 border-t pt-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-semibold">
                          Granted Authority:
                        </span>
                        <span className="text-foreground font-mono text-xs font-bold">
                          {grantedCount} of {totalPermsCount}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({grantedPercentage}%)
                        </span>
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground mr-1 text-[11px]">Show:</span>
                        {(
                          [
                            { key: "ALL", label: "All Scopes" },
                            { key: "GRANTED", label: "Granted Only" },
                            { key: "UNGRANTED", label: "Ungranted" },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setPermStatusFilter(tab.key)}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] transition-colors",
                              permStatusFilter === tab.key
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Permissions Search Bar */}
                    <div className="relative">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                      <Input
                        placeholder="Search permissions by name, action (e.g. read, write), or category…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e?.target?.value ?? "")}
                        className="h-8 pl-8.5 text-xs"
                      />
                      {permSearch && (
                        <button
                          type="button"
                          onClick={() => setPermSearch("")}
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Matrix Content */}
                <CardContent className="space-y-6 pt-5">
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <div className="text-muted-foreground py-10 text-center text-xs">
                      No permissions match your search or status filter.
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([resource, perms]) => {
                      const hasWildcard = activeRole.permissions.includes("*");
                      const categoryGrantedCount = perms.filter(
                        (p) => hasWildcard || activeRole.permissions.includes(p.key),
                      ).length;

                      return (
                        <div
                          key={resource}
                          className="border-border/60 bg-muted/10 space-y-3 rounded-xl border p-3.5"
                        >
                          <div className="border-border/50 flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-mono text-xs font-bold tracking-wider uppercase">
                                {resource.replace(/_/g, " ")}
                              </span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {categoryGrantedCount} / {perms.length} Active
                              </Badge>
                            </div>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {resource.toLowerCase()}::*
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {perms.map((perm) => {
                              const isGranted =
                                hasWildcard || activeRole.permissions.includes(perm.key);
                              return (
                                <div
                                  key={perm.id}
                                  className={cn(
                                    "flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors",
                                    isGranted
                                      ? "text-foreground border-emerald-500/30 bg-emerald-500/5 shadow-2xs"
                                      : "border-border/50 bg-background/50 text-muted-foreground opacity-40",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                                      isGranted
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {isGranted ? (
                                      <Check className="size-2.5 stroke-[3]" />
                                    ) : (
                                      <span className="bg-muted-foreground/50 size-1 rounded-full" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-foreground truncate text-xs font-semibold">
                                        {perm.name}
                                      </span>
                                      <PermissionActionChip action={perm.action} />
                                    </div>
                                    <code className="text-muted-foreground mt-0.5 block truncate font-mono text-[10px]">
                                      {perm.key}
                                    </code>
                                    {perm.description && (
                                      <p className="text-muted-foreground mt-1 line-clamp-2 text-[10px]">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
                Select a platform role to view its effective permissions matrix.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
