"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  hasTenantPermission,
  useActiveTenant,
  useTenantContext,
  useTenantMembers,
} from "@/features/tenants";

import {
  useAddTenantGroupMembers,
  useArchiveTenantGroup,
  useCreateTenantGroup,
  useRemoveTenantGroupMember,
  useTenantGroupMembers,
  useTenantGroups,
  useUpdateTenantGroup,
} from "../queries";
import type { CreateGroupValues, UpdateGroupValues } from "../schemas";
import type { GroupFilters, UserGroup } from "../types";
import { GroupFormDialog } from "./group-form-dialog";
import { GroupMembersDialog, type CandidateMember } from "./group-members-dialog";
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

  // Tenant members (for candidate selection)
  const { data: tenantMembers = [] } = useTenantMembers(activeTenantId);
  const candidateMembers: CandidateMember[] = useMemo(() => {
    return (tenantMembers ?? [])
      .filter((m) => m?.status === "ACTIVE")
      .map((m) => ({
        id: m?.userId ?? m?.id,
        name: m?.name ?? "Unknown",
        email: m?.email ?? "",
      }));
  }, [tenantMembers]);

  // Mutations
  const createGroupMutation = useCreateTenantGroup(activeTenantId);
  const updateGroupMutation = useUpdateTenantGroup(activeTenantId);
  const archiveGroupMutation = useArchiveTenantGroup(activeTenantId);
  const addMembersMutation = useAddTenantGroupMembers(activeTenantId);
  const removeMemberMutation = useRemoveTenantGroupMember(activeTenantId);

  // Modal states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<UserGroup | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  // Group members query for the selected group
  const { data: membersData, isLoading: isLoadingMembers } = useTenantGroupMembers(
    activeTenantId,
    selectedGroup?.id,
    { page: 1, limit: 100 },
  );
  const groupMembers = membersData?.items ?? [];

  // Permissions check
  const canCreate = hasTenantPermission(permissions, "groups:create");
  const canEdit = hasTenantPermission(permissions, "groups:update");
  const canArchive = hasTenantPermission(permissions, "groups:delete");
  const canManageMembers = hasTenantPermission(permissions, "groups:manage-members");

  const createHref = activeTenant?.slug ? `/w/${activeTenant.slug}/groups/new` : "/groups/new";

  const getDetailHref = (group: UserGroup) =>
    activeTenant?.slug ? `/w/${activeTenant.slug}/groups/${group.id}` : `/groups/${group.id}`;

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
        toast.success(`User group "${values?.name}" updated successfully.`);
      } else {
        await createGroupMutation.mutateAsync(values);
        toast.success(`User group "${values?.name}" created successfully.`);
      }
      setFormDialogOpen(false);
      setGroupToEdit(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save user group.";
      toast.error(message);
      throw err;
    }
  };

  const handleArchive = async (group: UserGroup) => {
    if (!confirm(`Are you sure you want to archive "${group?.name}"?`)) return;
    try {
      await archiveGroupMutation.mutateAsync(group.id);
      toast.success(`Group "${group?.name}" has been archived.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive user group.";
      toast.error(message);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    if (!selectedGroup) return;
    try {
      const res = await addMembersMutation.mutateAsync({
        groupId: selectedGroup.id,
        userIds: memberIds,
      });
      toast.success(
        `Added ${res?.addedCount ?? memberIds?.length} members to ${selectedGroup?.name}.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add members to group.";
      toast.error(message);
      throw err;
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      await removeMemberMutation.mutateAsync({
        groupId: selectedGroup.id,
        userId,
      });
      toast.success("Member removed from group.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member from group.";
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
