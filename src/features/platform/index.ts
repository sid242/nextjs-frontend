export * from "./schemas";
export { platformKeys } from "./keys";
export {
  staffListQueryOptions,
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
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
  useUpdatePlatformTenantSubscription,
  platformMeQueryOptions,
  usePlatformMe,
  usePlatformLogin,
  usePlatformLogout,
  platformTwoFactorStatusQueryOptions,
  usePlatformTwoFactorStatus,
  useSetupPlatformTwoFactor,
  useEnablePlatformTwoFactor,
  useDisablePlatformTwoFactor,
  useVerifyPlatformTwoFactor,
} from "./queries";

export { PlatformShell } from "./components/platform-shell";
export { PlatformDashboard } from "./components/platform-dashboard";
export { StaffTable } from "./components/staff-table";
export { RolesMatrix } from "./components/roles-matrix";
export { SupportSessionsTable } from "./components/support-sessions-table";
export { AuditLogsTable } from "./components/audit-logs-table";
export { PlatformLoginForm } from "./components/platform-login-form";
export { SupportSessionBanner } from "./components/support-session-banner";
export { TenantsTable } from "./components/tenants-table";
export { ProvisionTenantDialog } from "./components/provision-tenant-dialog";
export { TenantInspector } from "./components/tenant-inspector";
export { PlatformTwoFactorDialog } from "./components/platform-two-factor-dialog";
export { PlatformPermissionGate } from "./components/platform-permission-gate";
export {
  PLATFORM_PERMISSION_KEYS,
  hasPlatformPermission,
  hasAllPlatformPermissions,
  type PlatformPermissionKey,
} from "./permissions";
export * from "./constants";
