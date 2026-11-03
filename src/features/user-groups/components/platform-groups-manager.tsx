"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  hasPlatformPermission,
  PLATFORM_PERMISSION_KEYS,
  usePlatformMe,
} from "@/features/platform";

import { useArchivePlatformGroup, usePlatformGroups } from "../queries";
import type { GroupFilters, UserGroup } from "../types";
import { GroupStatsCards } from "./group-stats-cards";
import { GroupsTable } from "./groups-table";

export function PlatformGroupsManager() {
  const { data: staff } = usePlatformMe();

  const [filters, setFilters] = useState<GroupFilters>({
    page: 1,
    limit: 20,
    status: "ACTIVE",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Groups query
  const { data: groupsData, isLoading } = usePlatformGroups(filters);
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
  const archiveGroupMutation = useArchivePlatformGroup();

  // Archive modal state
  const [groupToArchive, setGroupToArchive] = useState<UserGroup | null>(null);

  // Permissions check
  const canCreate = hasPlatformPermission(staff, PLATFORM_PERMISSION_KEYS.GROUPS_CREATE);
  const canEdit = hasPlatformPermission(staff, PLATFORM_PERMISSION_KEYS.GROUPS_UPDATE);
  const canArchive = hasPlatformPermission(staff, PLATFORM_PERMISSION_KEYS.GROUPS_DELETE);
  const canManageMembers = hasPlatformPermission(
    staff,
    PLATFORM_PERMISSION_KEYS.GROUPS_MANAGE_MEMBERS,
  );

  const createHref = "/platform/groups/new";
  const getDetailHref = (group: UserGroup) => `/platform/groups/${group.id}`;
  const getEditHref = (group: UserGroup) => `/platform/groups/${group.id}/edit`;

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
      toast.success(`Platform group "${groupToArchive.name}" has been archived.`);
      setGroupToArchive(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive platform group.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Staff Groups"
          description="Organize internal platform staff into operational teams, incident queues, and auditor cohorts."
        />
        {canCreate && (
          <Button asChild className="w-full gap-2 shadow-xs sm:w-auto">
            <Link href={createHref}>
              <Plus className="size-4" /> Create Staff Group
            </Link>
          </Button>
        )}
      </div>

      <GroupStatsCards
        totalGroups={total}
        activeGroups={activeGroupsCount}
        totalMembers={totalMembershipsCount}
        scope="PLATFORM"
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
        title="Archive Staff Group"
        description={`Are you sure you want to archive "${groupToArchive?.name}"? Assigned staff will be preserved in historical audit records.`}
        confirmLabel="Archive Group"
        destructive
        onConfirm={handleArchiveConfirm}
        pending={archiveGroupMutation.isPending}
      />
    </div>
  );
}
