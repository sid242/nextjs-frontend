export type {
  GroupFilters,
  GroupScope,
  GroupStatus,
  PaginatedResult,
  PlatformGroupMember,
  TenantGroupMember,
  UserGroup,
} from "./types";

export {
  addMembersSchema,
  createGroupSchema,
  groupSlugRegex,
  updateGroupSchema,
  type AddMembersValues,
  type CreateGroupValues,
  type UpdateGroupValues,
} from "./schemas";

export { groupKeys } from "./keys";

export {
  platformGroupDetailQueryOptions,
  platformGroupMembersQueryOptions,
  platformGroupsQueryOptions,
  tenantGroupDetailQueryOptions,
  tenantGroupMembersQueryOptions,
  tenantGroupsQueryOptions,
  useAddPlatformGroupMembers,
  useAddTenantGroupMembers,
  useArchivePlatformGroup,
  useArchiveTenantGroup,
  useCreatePlatformGroup,
  useCreateTenantGroup,
  usePlatformGroup,
  usePlatformGroupMembers,
  usePlatformGroups,
  useRemovePlatformGroupMember,
  useRemoveTenantGroupMember,
  useTenantGroup,
  useTenantGroupMembers,
  useTenantGroups,
  useUpdatePlatformGroup,
  useUpdateTenantGroup,
} from "./queries";

export { GroupStatusBadge } from "./components/group-status-badge";
export { GroupFormDialog } from "./components/group-form-dialog";
export { GroupMembersDialog } from "./components/group-members-dialog";
export { GroupsTable } from "./components/groups-table";
export { GroupStatsCards } from "./components/group-stats-cards";
export { GroupFormPage } from "./components/group-form-page";
export { GroupDetailsPage } from "./components/group-details-page";
export { TenantGroupsManager } from "./components/tenant-groups-manager";
export { PlatformGroupsManager } from "./components/platform-groups-manager";
