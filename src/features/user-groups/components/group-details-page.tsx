"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Globe,
  Key,
  Loader2,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { ControlledInput, ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  hasPlatformPermission,
  PLATFORM_PERMISSION_KEYS,
  usePlatformMe,
  useStaffList,
} from "@/features/platform";
import { useTenantRoles } from "@/features/rbac";
import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  useActiveTenant,
  useTenantContext,
  useTenantMembers,
} from "@/features/tenants";

import {
  useAddPlatformGroupMembers,
  useAddTenantGroupMembers,
  useArchivePlatformGroup,
  useArchiveTenantGroup,
  useBindTenantGroupRole,
  usePlatformGroup,
  usePlatformGroupMembers,
  useRemovePlatformGroupMember,
  useRemoveTenantGroupMember,
  useTenantGroup,
  useTenantGroupMembers,
  useTenantGroupPermissions,
  useTenantGroupRoles,
  useUnbindTenantGroupRole,
} from "../queries";
import { bindRoleSchema, type BindRoleValues } from "../schemas";
import type { PlatformGroupMember, TenantGroupMember } from "../types";
import { GroupStatusBadge } from "./group-status-badge";

interface GroupDetailsPageProps {
  scope: "TENANT" | "PLATFORM";
  groupId: string;
  backHref?: string;
}

export function GroupDetailsPage({ scope, groupId, backHref }: GroupDetailsPageProps) {
  const router = useRouter();
  const { activeTenant, activeTenantId: rawTenantId } = useActiveTenant();
  const activeTenantId = rawTenantId ?? undefined;

  // Permissions
  const { data: tenantContext } = useTenantContext(activeTenantId);
  const { data: platformStaff } = usePlatformMe();

  const canEdit =
    scope === "TENANT"
      ? hasTenantPermission(tenantContext?.permissions ?? [], TENANT_PERMISSIONS.GROUPS_UPDATE)
      : hasPlatformPermission(platformStaff, PLATFORM_PERMISSION_KEYS.GROUPS_UPDATE);

  const canArchive =
    scope === "TENANT"
      ? hasTenantPermission(tenantContext?.permissions ?? [], TENANT_PERMISSIONS.GROUPS_DELETE)
      : hasPlatformPermission(platformStaff, PLATFORM_PERMISSION_KEYS.GROUPS_DELETE);

  const canManageMembers =
    scope === "TENANT"
      ? hasTenantPermission(
          tenantContext?.permissions ?? [],
          TENANT_PERMISSIONS.GROUPS_MANAGE_MEMBERS,
        )
      : hasPlatformPermission(platformStaff, PLATFORM_PERMISSION_KEYS.GROUPS_MANAGE_MEMBERS);

  // Group Details Query
  const { data: tenantGroup, isLoading: loadingTenantGroup } = useTenantGroup(
    activeTenantId,
    scope === "TENANT" ? groupId : undefined,
  );

  const { data: platformGroup, isLoading: loadingPlatformGroup } = usePlatformGroup(
    scope === "PLATFORM" ? groupId : undefined,
  );

  const group = scope === "TENANT" ? tenantGroup : platformGroup;
  const isLoading = scope === "TENANT" ? loadingTenantGroup : loadingPlatformGroup;

  // Group Members Query
  const { data: tenantMembersData, isLoading: loadingTenantMembers } = useTenantGroupMembers(
    activeTenantId,
    scope === "TENANT" ? groupId : undefined,
    {
      page: 1,
      limit: 100,
    },
  );

  const { data: platformMembersData, isLoading: loadingPlatformMembers } = usePlatformGroupMembers(
    scope === "PLATFORM" ? groupId : undefined,
    {
      page: 1,
      limit: 100,
    },
  );

  const members = useMemo(
    () =>
      scope === "TENANT" ? (tenantMembersData?.items ?? []) : (platformMembersData?.items ?? []),
    [scope, tenantMembersData, platformMembersData],
  );
  const isLoadingMembers = scope === "TENANT" ? loadingTenantMembers : loadingPlatformMembers;

  // Candidate members for inline assignment
  const { data: allTenantMembers = [] } = useTenantMembers(
    scope === "TENANT" ? activeTenantId : undefined,
  );
  const { data: allStaffData } = useStaffList(scope === "PLATFORM" ? { limit: 100 } : undefined);

  // Existing assigned member IDs
  const assignedMemberIds = useMemo(() => {
    return new Set(
      members.map((m: TenantGroupMember | PlatformGroupMember) =>
        "userId" in m ? m.userId : m.staffId,
      ),
    );
  }, [members]);

  const candidates = useMemo(() => {
    if (scope === "TENANT") {
      return (allTenantMembers ?? [])
        .filter((m) => m?.status === "ACTIVE" && !assignedMemberIds.has(m?.userId ?? m?.id))
        .map((m) => ({
          id: m?.userId ?? m?.id,
          name: m?.name ?? "Unknown",
          email: m?.email ?? "",
        }));
    }
    return (allStaffData?.items ?? [])
      .filter((s) => s?.status === "ACTIVE" && !assignedMemberIds.has(s?.id))
      .map((s) => ({
        id: s?.id,
        name: s?.displayName ?? "Unknown",
        email: s?.email ?? "",
      }));
  }, [scope, allTenantMembers, allStaffData, assignedMemberIds]);

  // Mutations
  const archiveTenantGroupMutation = useArchiveTenantGroup(activeTenantId);
  const archivePlatformGroupMutation = useArchivePlatformGroup();
  const addTenantMembersMutation = useAddTenantGroupMembers(activeTenantId);
  const addPlatformMembersMutation = useAddPlatformGroupMembers();
  const removeTenantMemberMutation = useRemoveTenantGroupMember(activeTenantId);
  const removePlatformMemberMutation = useRemovePlatformGroupMember();

  // Inline assignment panel state
  const [isAssigningOpen, setIsAssigningOpen] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [candidateSearch, setCandidateSearch] = useState("");

  // Confirmation modals state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const defaultBackHref =
    backHref ??
    (scope === "TENANT"
      ? activeTenant?.slug
        ? `/w/${activeTenant.slug}/groups`
        : "/groups"
      : "/platform/groups");

  const editHref =
    scope === "TENANT"
      ? activeTenant?.slug
        ? `/w/${activeTenant.slug}/groups/${groupId}/edit`
        : `/groups/${groupId}/edit`
      : `/platform/groups/${groupId}/edit`;

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const term = memberSearch.toLowerCase();
    return members.filter((m: TenantGroupMember | PlatformGroupMember) => {
      const name = "name" in m ? m.name : m.displayName;
      const email = m.email ?? "";
      return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
    });
  }, [members, memberSearch]);

  const filteredCandidates = useMemo(() => {
    if (!candidateSearch.trim()) return candidates;
    const term = candidateSearch.toLowerCase();
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term),
    );
  }, [candidates, candidateSearch]);

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleArchive = async () => {
    try {
      if (scope === "TENANT") {
        await archiveTenantGroupMutation.mutateAsync(groupId);
      } else {
        await archivePlatformGroupMutation.mutateAsync(groupId);
      }
      toast.success(`Group "${group?.name}" archived successfully.`);
      setArchiveDialogOpen(false);
      router.push(defaultBackHref);
    } catch {
      toast.error("Failed to archive user group.");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      if (scope === "TENANT") {
        await removeTenantMemberMutation.mutateAsync({ groupId, userId: memberToRemove.id });
      } else {
        await removePlatformMemberMutation.mutateAsync({ groupId, staffId: memberToRemove.id });
      }
      toast.success(`${memberToRemove.name} removed from this group.`);
      setMemberToRemove(null);
    } catch {
      toast.error("Failed to remove member from group.");
    }
  };

  const handleAssignSelected = async () => {
    if (selectedCandidateIds.length === 0) return;
    try {
      if (scope === "TENANT") {
        await addTenantMembersMutation.mutateAsync({ groupId, userIds: selectedCandidateIds });
      } else {
        await addPlatformMembersMutation.mutateAsync({ groupId, staffIds: selectedCandidateIds });
      }
      toast.success(`Assigned ${selectedCandidateIds.length} members to ${group?.name}.`);
      setSelectedCandidateIds([]);
      setIsAssigningOpen(false);
    } catch {
      toast.error("Failed to assign members.");
    }
  };

  // Group Role Bindings & Contributed Permissions (Tenant scope)
  const canAssignRoles =
    scope === "TENANT" &&
    hasTenantPermission(tenantContext?.permissions ?? [], TENANT_PERMISSIONS.GROUPS_ASSIGN_ROLES);

  const { data: groupRoles = [], isLoading: loadingGroupRoles } = useTenantGroupRoles(
    activeTenantId,
    scope === "TENANT" ? groupId : undefined,
  );

  const { data: groupPermissionsData, isLoading: loadingGroupPermissions } =
    useTenantGroupPermissions(activeTenantId, scope === "TENANT" ? groupId : undefined);

  const { data: allTenantRolesData } = useTenantRoles(
    scope === "TENANT" ? activeTenantId : undefined,
  );

  const bindTenantGroupRoleMutation = useBindTenantGroupRole(activeTenantId);
  const unbindTenantGroupRoleMutation = useUnbindTenantGroupRole(activeTenantId);

  const [isAssigningRoleOpen, setIsAssigningRoleOpen] = useState(false);
  const [roleToUnbind, setRoleToUnbind] = useState<{ id: string; name: string } | null>(null);

  const boundRoleIds = useMemo(() => new Set(groupRoles.map((r) => r.id)), [groupRoles]);
  const candidateRoles = useMemo(
    () => (allTenantRolesData ?? []).filter((r) => (r.isActive ?? true) && !boundRoleIds.has(r.id)),
    [allTenantRolesData, boundRoleIds],
  );

  const roleSelectOptions = useMemo(
    () =>
      candidateRoles.map((r) => ({
        value: r.id,
        label: `${r.name} (${r.code ?? "CUSTOM"}${r.isSystem ? " - System" : ""})`,
      })),
    [candidateRoles],
  );

  const bindRoleMethods = useForm<BindRoleValues>({
    resolver: zodResolver(bindRoleSchema),
    defaultValues: {
      roleId: "",
      reason: "",
    },
  });

  const handleBindRoleSubmit: SubmitHandler<BindRoleValues> = async (data) => {
    try {
      await bindTenantGroupRoleMutation.mutateAsync({
        groupId,
        input: {
          roleId: data.roleId,
          reason: data.reason?.trim() ? data.reason.trim() : undefined,
        },
      });
      toast.success("Role bound to user group successfully.");
      bindRoleMethods.reset();
      setIsAssigningRoleOpen(false);
    } catch {
      toast.error("Failed to bind role to user group.");
    }
  };

  const handleUnbindRole = async () => {
    if (!roleToUnbind) return;
    try {
      await unbindTenantGroupRoleMutation.mutateAsync({ groupId, roleId: roleToUnbind.id });
      toast.success(`Role "${roleToUnbind.name}" unbound successfully.`);
      setRoleToUnbind(null);
    } catch {
      toast.error("Failed to unbind role.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={defaultBackHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
        <Card className="rounded-2xl border p-12 text-center">
          <Users className="text-muted-foreground/60 mx-auto h-12 w-12" />
          <h2 className="mt-4 text-lg font-semibold">User Group Not Found</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This group may have been removed or you do not have permission to access it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href={defaultBackHref}>
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
        <span className="text-muted-foreground text-sm font-medium">/</span>
        <span className="text-sm font-medium">{group.name}</span>
      </div>

      {/* Group Header Hero Card */}
      <Card className="border-border/80 bg-card/60 overflow-hidden rounded-2xl shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-xl font-bold text-indigo-600 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-400">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
                  <Badge variant="outline" className="font-mono text-xs">
                    {group.slug}
                  </Badge>
                  <GroupStatusBadge status={group.status} />
                  <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
                    <Lock className="h-2.5 w-2.5" />
                    {group.scope}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-2xl text-sm">
                  {group.description || "No description provided for this user group."}
                </p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 pt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                  {scope === "TENANT" && activeTenant && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {activeTenant.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions (All full-page links or confirmation modals) */}
            <div className="flex flex-wrap items-center gap-2">
              {canManageMembers && group.status === "ACTIVE" && (
                <Button
                  onClick={() => setIsAssigningOpen((prev) => !prev)}
                  className="gap-2 shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Add Members
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" asChild className="gap-2">
                  <Link href={editHref}>
                    <Edit className="h-4 w-4" /> Edit Details
                  </Link>
                </Button>
              )}
              {canArchive && group.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  onClick={() => setArchiveDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10 gap-2"
                >
                  <Archive className="h-4 w-4" /> Archive Group
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="bg-muted/70 rounded-xl p-1">
          <TabsTrigger value="members" className="gap-2 rounded-lg">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          {scope === "TENANT" && (
            <>
              <TabsTrigger value="roles" className="gap-2 rounded-lg">
                <Shield className="h-4 w-4" />
                Assigned Roles ({groupRoles.length})
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2 rounded-lg">
                <Key className="h-4 w-4" />
                Permissions ({groupPermissionsData?.permissions?.length ?? 0})
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="details" className="gap-2 rounded-lg">
            <Clock className="h-4 w-4" />
            Governance & Metadata
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Members */}
        <TabsContent value="members" className="space-y-4">
          {/* Inline Member Assignment Panel (Replaces popup modal) */}
          {isAssigningOpen && (
            <Card className="border-border/80 bg-muted/20 rounded-2xl border p-5">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="text-base font-semibold">Assign Members to {group.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    Select active accounts to add to this group.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAssigningOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search candidate members..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="h-9 pl-9 text-sm"
                  />
                </div>

                <div className="divide-border max-h-56 divide-y overflow-y-auto rounded-xl border">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-xs">
                      {candidates.length === 0
                        ? "All active members are already assigned to this group."
                        : "No candidate members matched your search."}
                    </div>
                  ) : (
                    filteredCandidates.map((c) => {
                      const isSelected = selectedCandidateIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleCandidate(c.id)}
                          className="hover:bg-muted/40 flex cursor-pointer items-center justify-between p-2.5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCandidate(c.id)}
                            />
                            <div>
                              <div className="text-sm font-medium">{c.name}</div>
                              <div className="text-muted-foreground text-xs">{c.email}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge variant="outline" className="text-primary text-[10px]">
                              Selected
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAssigningOpen(false);
                      setSelectedCandidateIds([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAssignSelected}
                    disabled={
                      selectedCandidateIds.length === 0 ||
                      addTenantMembersMutation.isPending ||
                      addPlatformMembersMutation.isPending
                    }
                  >
                    {addTenantMembersMutation.isPending || addPlatformMembersMutation.isPending
                      ? "Assigning..."
                      : `Assign (${selectedCandidateIds.length}) Selected`}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search assigned members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
            {canManageMembers && group.status === "ACTIVE" && !isAssigningOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssigningOpen(true)}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Assign More Members
              </Button>
            )}
          </div>

          <div className="bg-card/40 overflow-hidden rounded-2xl border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-72">Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-44">Date Added</TableHead>
                  {canManageMembers && group.status === "ACTIVE" && (
                    <TableHead className="w-20 text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMembers ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-36 text-center">
                      <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
                      <p className="text-muted-foreground mt-2 text-sm">Loading group members...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-36 text-center">
                      <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
                      <h4 className="mt-2 text-sm font-semibold">No members in this group</h4>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {memberSearch
                          ? "No assigned members matched your search query."
                          : "Assign workspace accounts to organize them within this group."}
                      </p>
                      {canManageMembers &&
                        group.status === "ACTIVE" &&
                        !memberSearch &&
                        !isAssigningOpen && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAssigningOpen(true)}
                            className="mt-3 gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add First Member
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((m: TenantGroupMember | PlatformGroupMember) => {
                    const memberId = "userId" in m ? (m.userId ?? m.id) : (m.staffId ?? m.id);
                    const name = "name" in m ? m.name : m.displayName;
                    const email = m.email || "—";
                    const addedAt = m.joinedGroupAt
                      ? new Date(m.joinedGroupAt).toLocaleDateString()
                      : "—";

                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                              {name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="font-medium">{name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {email}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{addedAt}</TableCell>
                        {canManageMembers && group.status === "ACTIVE" && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMemberToRemove({ id: memberId, name })}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                              title="Remove member from group"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Assigned Roles (Tenant Scope) */}
        {scope === "TENANT" && (
          <TabsContent value="roles" className="space-y-4">
            <Card className="rounded-2xl border shadow-xs">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Assigned Workspace Roles</CardTitle>
                  <CardDescription>
                    Roles bound to this group grant permissions to all active group members.
                  </CardDescription>
                </div>
                {canAssignRoles && group.status === "ACTIVE" && (
                  <Button
                    onClick={() => setIsAssigningRoleOpen((prev) => !prev)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Bind Role
                  </Button>
                )}
              </CardHeader>

              {/* Inline Role Assignment Form */}
              {isAssigningRoleOpen && (
                <div className="border-border/80 bg-muted/20 mx-6 mb-6 space-y-3 rounded-2xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Bind Workspace Role</h4>
                      <p className="text-muted-foreground text-xs">
                        Select an active tenant role to grant to all members of this group.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAssigningRoleOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormWrapper
                    methods={bindRoleMethods}
                    onSubmit={handleBindRoleSubmit}
                    className="space-y-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ControlledSelect
                        name="roleId"
                        label="Select Role"
                        options={roleSelectOptions}
                        returnPrimitiveValue
                        required
                        placeholder="-- Choose a role --"
                      />

                      <ControlledInput
                        name="reason"
                        label="Reason"
                        placeholder="e.g. Standard billing team access"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAssigningRoleOpen(false)}
                      >
                        Cancel
                      </Button>
                      <SubmitButton
                        pending={bindTenantGroupRoleMutation.isPending}
                        pendingText="Binding Role…"
                        size="sm"
                      >
                        Confirm Role Binding
                      </SubmitButton>
                    </div>
                  </FormWrapper>
                </div>
              )}

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      {canAssignRoles && (
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingGroupRoles ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : groupRoles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground h-32 text-center text-sm"
                        >
                          No roles bound to this group yet. This group currently grants zero
                          permissions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="text-primary h-4 w-4 shrink-0" />
                              <span>{role.name}</span>
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-[10px]">
                                  System
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-muted-foreground line-clamp-1 text-xs">
                                {role.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{role.code ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {role.scope}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {role.permissions?.length ?? 0} permissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {role.isActive ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                              >
                                Disabled
                              </Badge>
                            )}
                          </TableCell>
                          {canAssignRoles && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRoleToUnbind({ id: role.id, name: role.name })}
                                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                                title="Unbind role from group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Contributed Permissions (Tenant Scope) */}
        {scope === "TENANT" && (
          <TabsContent value="permissions" className="space-y-4">
            <Card className="rounded-2xl border shadow-xs">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Contributed Permissions</CardTitle>
                    <CardDescription>
                      Aggregated permissions granted to members via this group&apos;s active roles.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1.5 font-mono text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {groupPermissionsData?.permissions?.length ?? 0} granted
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.status === "ARCHIVED" ? (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p className="text-sm">
                      This group is <strong>ARCHIVED</strong>. Inactive groups contribute 0 active
                      permissions to members regardless of assigned roles.
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted/40 text-muted-foreground rounded-xl border p-4 text-xs">
                    Active groups dynamically contribute their bound roles to workspace members with
                    an active status. Effective permissions equal the union of direct role
                    assignments and active group roles (
                    <code>P_effective = P_direct ∪ P_active_group_roles</code>).
                  </div>
                )}

                {loadingGroupPermissions ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  </div>
                ) : (groupPermissionsData?.permissions?.length ?? 0) === 0 ? (
                  <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                    No permissions contributed by this group. Bind one or more active roles to grant
                    permissions.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {groupPermissionsData?.permissions?.map((permissionKey) => (
                      <div
                        key={permissionKey}
                        className="bg-background flex items-center gap-2 rounded-lg border p-2.5 font-mono text-xs shadow-2xs"
                      >
                        <Key className="text-primary h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{permissionKey}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 2: Governance & Metadata */}
        <TabsContent value="details" className="space-y-4">
          <Card className="rounded-2xl border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg">Group Properties</CardTitle>
              <CardDescription>
                Auditable metadata and isolation configuration for this group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">Group Name</dt>
                  <dd className="mt-1 font-semibold">{group.name}</dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">
                    Slug Identifier
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold">{group.slug}</dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">
                    Scope Policy
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{group.scope}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {group.scope === "TENANT"
                        ? "Restricted strictly to active members of owning tenant"
                        : "Platform operator isolation"}
                    </span>
                  </dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">
                    Lifecycle Status
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <GroupStatusBadge status={group.status} />
                  </dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">Group ID</dt>
                  <dd className="text-muted-foreground mt-1 font-mono text-xs">{group.id}</dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">Tenant ID</dt>
                  <dd className="text-muted-foreground mt-1 font-mono text-xs">
                    {group.tenantId || "N/A (Platform Scope)"}
                  </dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">Created At</dt>
                  <dd className="mt-1 text-sm">{new Date(group.createdAt).toLocaleString()}</dd>
                </div>
                <div className="bg-muted/40 rounded-xl border p-3">
                  <dt className="text-muted-foreground font-mono text-xs uppercase">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm">{new Date(group.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Archive Dialog (Destructive confirmation only) */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive User Group"
        description={`Are you sure you want to archive "${group.name}"? Group members will remain assigned for auditing history, but the group will be deactivated.`}
        confirmLabel="Archive Group"
        destructive
        onConfirm={handleArchive}
        pending={
          scope === "TENANT"
            ? archiveTenantGroupMutation.isPending
            : archivePlatformGroupMutation.isPending
        }
      />

      {/* Confirm Remove Member Dialog (Destructive confirmation only) */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Group Member"
        description={`Are you sure you want to remove "${memberToRemove?.name}" from "${group.name}"?`}
        confirmLabel="Remove Member"
        destructive
        onConfirm={handleRemoveMember}
        pending={
          scope === "TENANT"
            ? removeTenantMemberMutation.isPending
            : removePlatformMemberMutation.isPending
        }
      />

      {/* Confirm Unbind Role Dialog (Destructive confirmation only) */}
      <ConfirmDialog
        open={Boolean(roleToUnbind)}
        onOpenChange={(open) => !open && setRoleToUnbind(null)}
        title="Unbind Role from Group"
        description={`Are you sure you want to unbind the role "${roleToUnbind?.name}" from "${group.name}"? Members of this group will no longer receive permissions from this role (unless granted via another group or direct assignment).`}
        confirmLabel="Unbind Role"
        destructive
        onConfirm={handleUnbindRole}
        pending={unbindTenantGroupRoleMutation.isPending}
      />
    </div>
  );
}
