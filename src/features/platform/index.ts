"use client";

export * from "./schemas";
export { platformKeys } from "./keys";
export {
  staffListQueryOptions,
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  platformUsersQueryOptions,
  usePlatformUsers,
  usePlatformUser,
  useUpdatePlatformUserStatus,
  platformRolesQueryOptions,
  usePlatformRoles,
  useCreatePlatformRole,
  useUpdatePlatformRole,
  platformPermissionsQueryOptions,
  usePlatformPermissions,
  supportSessionsQueryOptions,
  useSupportSessions,
  useStartSupportSession,
  useEndSupportSession,
  platformAuditLogsQueryOptions,
  usePlatformAuditLogs,
  platformTenantsQueryOptions,
  usePlatformTenants,
  platformTenantDetailQueryOptions,
  usePlatformTenant,
  platformTenantMembersQueryOptions,
  usePlatformTenantMembers,
  useProvisionTenant,
  useUpdatePlatformTenant,
  useSuspendTenant,
  useActivateTenant,
  useCloseTenant,
  useRetryTenantProvisioning,
  useUpdatePlatformTenantSubscription,
  tenantDbHealthQueryOptions,
  useTenantDbHealth,
  useMigrateTenantDatabase,
  useRollbackTenantDatabase,
  tenantDatabasesQueryOptions,
  useTenantDatabases,
  useExecuteTenantDatabaseOperation,
  platformMeQueryOptions,
  usePlatformMe,
  useUpdatePlatformProfile,
  useChangePlatformPassword,
  usePlatformLogin,
  usePlatformLogout,
  platformTwoFactorStatusQueryOptions,
  usePlatformTwoFactorStatus,
  useSetupPlatformTwoFactor,
  useEnablePlatformTwoFactor,
  useDisablePlatformTwoFactor,
  useVerifyPlatformTwoFactor,
  usePlatformPolicies,
  usePlatformPolicy,
  useCreatePlatformPolicy,
  useUpdatePlatformPolicy,
  useDeletePlatformPolicy,
  useAttachPlatformPolicyToRole,
  useDetachPlatformPolicyFromRole,
  usePlatformRolePolicies,
} from "./queries";

export { PlatformShell } from "./components/platform-shell";
export { PlatformDashboard } from "./components/platform-dashboard";
export { DatabaseOperationsTable } from "./components/database-operations-table";
export { StaffTable } from "./components/staff-table";
export { PlatformUsersTable } from "./components/users-table";
export { RolesMatrix } from "./components/roles-matrix";
export { SupportSessionsTable } from "./components/support-sessions-table";
export { AuditLogsTable } from "./components/audit-logs-table";
export { PlatformLoginForm } from "./components/platform-login-form";
export { SupportSessionBanner } from "./components/support-session-banner";
export { TenantsTable } from "./components/tenants-table";
export { ProvisionTenantDialog } from "./components/provision-tenant-dialog";
export { ProvisionTenantPage } from "./components/provision-tenant-page";
export { RoleFormPage } from "./components/role-form-page";
export { StaffFormPage } from "./components/staff-form-page";
export { TenantInspector } from "./components/tenant-inspector";
export { PlatformTwoFactorDialog } from "./components/platform-two-factor-dialog";
export { PlatformProfileDialog } from "./components/platform-profile-dialog";
export { PlatformChangePasswordDialog } from "./components/platform-change-password-dialog";
export { PlatformAccountView } from "./components/platform-account-view";
export { PlatformPoliciesTable } from "./components/platform-policies-table";
export { PlatformPolicyFormPage } from "./components/platform-policy-form-page";
export { AttachPlatformRoleDialog } from "./components/attach-platform-role-dialog";
export { PlatformPermissionGate } from "./components/platform-permission-gate";
export {
  PLATFORM_PERMISSION_KEYS,
  PLATFORM_ROLES,
  hasPlatformPermission,
  hasAllPlatformPermissions,
  type PlatformPermissionKey,
  type PlatformRoleKey,
} from "./permissions";
export * from "./constants";
