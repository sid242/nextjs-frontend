"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  hasPlatformPermission,
  PLATFORM_PERMISSION_KEYS,
  usePlatformMe,
  useStaffList,
} from "@/features/platform";

import {
  useAddPlatformGroupMembers,
  useArchivePlatformGroup,
  useCreatePlatformGroup,
  usePlatformGroupMembers,
  usePlatformGroups,
  useRemovePlatformGroupMember,
  useUpdatePlatformGroup,
} from "../queries";
import type { CreateGroupValues, UpdateGroupValues } from "../schemas";
import type { GroupFilters, UserGroup } from "../types";
import { GroupFormDialog } from "./group-form-dialog";
import { GroupMembersDialog, type CandidateMember } from "./group-members-dialog";
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

  // Staff members (for candidate selection)
  const { data: staffData } = useStaffList({ limit: 100 });
  const candidateMembers: CandidateMember[] = useMemo(() => {
    return (staffData?.items ?? [])
      .filter((s) => s?.status === "ACTIVE")
      .map((s) => ({
        id: s?.id,
        name: s?.displayName ?? "Unknown",
        email: s?.email ?? "",
      }));
  }, [staffData]);

  // Mutations
  const createGroupMutation = useCreatePlatformGroup();
  const updateGroupMutation = useUpdatePlatformGroup();
  const archiveGroupMutation = useArchivePlatformGroup();
  const addMembersMutation = useAddPlatformGroupMembers();
  const removeMemberMutation = useRemovePlatformGroupMember();

  // Modal states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<UserGroup | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  // Group members query for the selected group
  const { data: membersData, isLoading: isLoadingMembers } = usePlatformGroupMembers(
    selectedGroup?.id,
    { page: 1, limit: 100 },
  );
  const groupMembers = membersData?.items ?? [];

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

  const activeGroupsCount = useMemo(
    () => groups.filter((g) => g.status === "ACTIVE").length,
    [groups],
  );

  const totalMembershipsCount = useMemo(
    () => groups.reduce((acc, g) => acc + (g.memberCount ?? 0), 0),
    [groups],
  );

  const handleCreateOrEditSubmit = async (values: CreateGroupValues) => {
    try {
      if (groupToEdit) {
        await updateGroupMutation.mutateAsync({
          groupId: groupToEdit.id,
          input: values as UpdateGroupValues,
        });
        toast.success(`Platform group "${values?.name}" updated successfully.`);
      } else {
        await createGroupMutation.mutateAsync(values);
        toast.success(`Platform group "${values?.name}" created successfully.`);
      }
      setFormDialogOpen(false);
      setGroupToEdit(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save platform group.";
      toast.error(message);
      throw err;
    }
  };

  const handleArchive = async (group: UserGroup) => {
    if (!confirm(`Are you sure you want to archive "${group?.name}"?`)) return;
    try {
      await archiveGroupMutation.mutateAsync(group.id);
      toast.success(`Platform group "${group?.name}" has been archived.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive platform group.";
      toast.error(message);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (!selectedGroup) return;
    try {
      const res = await addMembersMutation.mutateAsync({
        groupId: selectedGroup.id,
        staffIds: memberIds,
      });
      toast.success(
        `Added ${res?.addedCount ?? memberIds?.length} staff to ${selectedGroup?.name}.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add staff to group.";
      toast.error(message);
      throw err;
    }
  };

  const handleRemoveMember = async (staffId: string) => {
    if (!selectedGroup) return;
    try {
      await removeMemberMutation.mutateAsync({
        groupId: selectedGroup.id,
        staffId,
      });
      toast.success("Staff member removed from group.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove staff from group.";
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
        onCreateClick={() => {
          setGroupToEdit(null);
          setFormDialogOpen(true);
        }}
        onEditClick={(group) => {
          setGroupToEdit(group);
          setFormDialogOpen(true);
        }}
        onArchiveClick={handleArchive}
        onManageMembersClick={(group) => {
          setSelectedGroup(group);
          setMembersDialogOpen(true);
        }}
        canCreate={canCreate}
        canEdit={canEdit}
        canArchive={canArchive}
        canManageMembers={canManageMembers}
      />

      <GroupFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        groupToEdit={groupToEdit}
        onSubmit={handleCreateOrEditSubmit}
        isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
      />

      <GroupMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        group={selectedGroup}
        members={groupMembers}
        isLoadingMembers={isLoadingMembers}
        onRemoveMember={handleRemoveMember}
        onAddMembers={handleAddMembers}
        candidateMembers={candidateMembers}
        canManageMembers={canManageMembers}
      />
    </div>
  );
}
