"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  useActiveTenant,
  useTenantContext,
} from "@/features/tenants";

import { useArchiveTenantGroup, useTenantGroups } from "../queries";
import type { GroupFilters, UserGroup } from "../types";
import { GroupStatsCards } from "./group-stats-cards";
import { GroupsTable } from "./groups-table";

export function TenantGroupsManager() {
  const { activeTenant, activeTenantId: rawTenantId } = useActiveTenant();
  const activeTenantId = rawTenantId ?? undefined;
  const { data: context } = useTenantContext(activeTenantId);
  const permissions = context?.permissions ?? [];

  const [filters, setFilters] = useState<GroupFilters>({
    page: 1,
    limit: 20,
    status: "ACTIVE",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Groups query
  const { data: groupsData, isLoading } = useTenantGroups(activeTenantId, filters);
  const groups: UserGroup[] = useMemo(() => {
    if (Array.isArray(groupsData?.items)) return groupsData.items;
    if (Array.isArray(groupsData)) return groupsData as UserGroup[];
    return [];
  }, [groupsData]);

  const total = useMemo(() => {
    if (typeof groupsData?.total === "number") return groupsData.total;
    if (Array.isArray(groupsData)) return groupsData.length;
    return groups.length;
  }, [groupsData, groups]);

  // Mutations
  const archiveGroupMutation = useArchiveTenantGroup(activeTenantId);

  // Archive modal state
  const [groupToArchive, setGroupToArchive] = useState<UserGroup | null>(null);

  // Permissions check
  const canCreate = hasTenantPermission(permissions, TENANT_PERMISSIONS.GROUPS_CREATE);
  const canEdit = hasTenantPermission(permissions, TENANT_PERMISSIONS.GROUPS_UPDATE);
  const canArchive = hasTenantPermission(permissions, TENANT_PERMISSIONS.GROUPS_DELETE);
  const canManageMembers = hasTenantPermission(
    permissions,
    TENANT_PERMISSIONS.GROUPS_MANAGE_MEMBERS,
  );

  const createHref = activeTenant?.slug ? `/w/${activeTenant.slug}/groups/new` : "/groups/new";

  const getDetailHref = (group: UserGroup) =>
    activeTenant?.slug ? `/w/${activeTenant.slug}/groups/${group.id}` : `/groups/${group.id}`;

  const getEditHref = (group: UserGroup) =>
    activeTenant?.slug
      ? `/w/${activeTenant.slug}/groups/${group.id}/edit`
      : `/groups/${group.id}/edit`;

  const activeGroupsCount = useMemo(
    () => groups.filter((g) => g.status === "ACTIVE").length,
    [groups],
  );

  const totalMembershipsCount = useMemo(
    () => groups.reduce((acc, g) => acc + (g.memberCount ?? 0), 0),
    [groups],
  );

  const handleArchiveConfirm = async () => {
    if (!groupToArchive) return;
    try {
      await archiveGroupMutation.mutateAsync(groupToArchive.id);
      toast.success(`Group "${groupToArchive.name}" has been archived.`);
      setGroupToArchive(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive user group.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="User Groups"
          description={`Organize members within ${activeTenant?.name ?? "your organization"} for communication, bulk management, and operations.`}
        />
        {canCreate && (
          <Button asChild className="w-full gap-2 shadow-xs sm:w-auto">
            <Link href={createHref}>
              <Plus className="size-4" /> Create User Group
            </Link>
          </Button>
        )}
      </div>

      <GroupStatsCards
        totalGroups={total}
        activeGroups={activeGroupsCount}
        totalMembers={totalMembershipsCount}
        scope="TENANT"
      />

      <GroupsTable
        groups={groups}
        total={total}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
        createHref={canCreate ? createHref : undefined}
        detailHref={getDetailHref}
        editHref={canEdit ? getEditHref : undefined}
        onArchiveClick={(group) => setGroupToArchive(group)}
        canCreate={canCreate}
        canEdit={canEdit}
        canArchive={canArchive}
        canManageMembers={canManageMembers}
      />

      <ConfirmDialog
        open={Boolean(groupToArchive)}
        onOpenChange={(open) => !open && setGroupToArchive(null)}
        title="Archive User Group"
        description={`Are you sure you want to archive "${groupToArchive?.name}"? Assigned members will be preserved in historical audit records.`}
        confirmLabel="Archive Group"
        destructive
        onConfirm={handleArchiveConfirm}
        pending={archiveGroupMutation.isPending}
      />
    </div>
  );
}
