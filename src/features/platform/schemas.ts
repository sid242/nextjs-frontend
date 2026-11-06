import { z } from "zod";

// ==========================================
// 1. Staff Members
// ==========================================

export const staffMemberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  employeeCode: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  status: z.enum(["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  roleId: z.string().uuid(),
  roleKey: z.string().nullable().optional(),
  roleName: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  invitedAt: z.string().nullable().optional(),
  inviteExpiresAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type StaffMember = z.infer<typeof staffMemberSchema>;

export const inviteStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid staff email"),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters"),
  roleId: z.string().uuid("Please select a platform role"),
  employeeCode: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  invitationMessage: z.string().trim().max(1000).optional(),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(168).optional(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const createStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid staff email"),
  displayName: z.string().trim().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().uuid("Please select a platform role"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  displayName: z.string().trim().min(2).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
  roleId: z.string().uuid().optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ==========================================
// 1b. Customer Users (Platform Inspection)
// ==========================================

export const platformUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  emailVerified: z.boolean().default(false),
  phoneNumber: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PlatformUser = z.infer<typeof platformUserSchema>;

// ==========================================
// 2. Platform Roles & Canonical Permissions
// ==========================================

export const platformRoleSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isSystem: z.boolean(),
  isActive: z.boolean(),
  permissions: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
});

export type PlatformRole = z.infer<typeof platformRoleSchema>;

export const createPlatformRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z_]+$/,
      "Role key must be uppercase letters and underscores (e.g. BILLING_AUDITOR)",
    ),
  name: z.string().trim().min(2, "Role name must be at least 2 characters"),
  description: z.string().trim().max(300).optional(),
  permissionKeys: z.array(z.string()).min(1, "Select at least one canonical permission"),
});

export type CreatePlatformRoleInput = z.infer<typeof createPlatformRoleSchema>;

export const updatePlatformRoleSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export type UpdatePlatformRoleInput = z.infer<typeof updatePlatformRoleSchema>;

export const platformPermissionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string(),
  resource: z.string(),
  action: z.string(),
});

export type PlatformPermission = z.infer<typeof platformPermissionSchema>;

// ==========================================
// 3. Audited Support Sessions
// ==========================================

export const supportSessionSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  staffEmail: z.string().nullable().optional(),
  staffDisplayName: z.string().nullable().optional(),
  tenantId: z.string().uuid(),
  targetUserId: z.string().uuid().nullable().optional(),
  reason: z.string(),
  status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED"]),
  expiresAt: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable().optional(),
});

export type PlatformSupportSession = z.infer<typeof supportSessionSchema>;

export const startSupportSessionSchema = z.object({
  tenantId: z.string().uuid("Valid customer tenant ID required"),
  targetUserId: z.string().optional(),
  reason: z.string().trim().min(5, "Support reason must be at least 5 characters"),
  ticketRef: z.string().trim().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(120),
  acknowledgement: z.boolean().default(true).optional(),
});

export type StartSupportSessionInput = z.infer<typeof startSupportSessionSchema>;

export interface StartSupportSessionResponse {
  sessionId: string;
  tenantId: string;
  targetUserId?: string | null;
  ticketRef?: string | null;
  accessToken?: string;
  reason: string;
  expiresAt: string;
  status: string;
}

export interface PlatformTenantMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  joinedAt: string;
  roleName: string;
}

// ==========================================
// 4. Platform Audit Trail
// ==========================================

export const platformAuditLogSchema = z.object({
  id: z.string().uuid(),
  actorStaffId: z.string().uuid().nullable().optional(),
  staffDisplayName: z.string().nullable().optional(),
  staffEmail: z.string().nullable().optional(),
  action: z.string(),
  targetType: z.string().nullable().optional(),
  targetId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  requestId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type PlatformAuditLog = z.infer<typeof platformAuditLogSchema>;

// ==========================================
// 5. Staff Authentication
// ==========================================

export const platformLoginSchema = z.object({
  email: z.string().trim().email("Enter your platform staff email"),
  password: z.string().min(1, "Password is required"),
});

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;

export interface StaffAuthProfile {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  permissions: string[];
}

// ==========================================
// 6. Platform Tenant Oversight & Provisioning
// ==========================================

export const platformTenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  legalName: z.string().nullable().optional(),
  tenantCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  supportEmail: z.string().nullable().optional(),
  supportPhone: z.string().nullable().optional(),
  billingEmail: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIALING", "DEACTIVATED"]),
  provisioningStatus: z.string().optional(),
  provisioningStep: z.string().nullable().optional(),
  provisioningError: z.string().nullable().optional(),
  plan: z.string(),
  databaseMode: z.string().default("shared"),
  memberCount: z.number().default(0),
  ownerEmail: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  subscriptionId: z.string().nullable().optional(),
  subscriptionStatus: z.string().nullable().optional(),
  seatCount: z.number().nullable().optional(),
  trialEndsAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type PlatformTenant = z.infer<typeof platformTenantSchema>;

export const platformTenantDetailSchema = platformTenantSchema.extend({
  schemaVersion: z.string().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  subscription: z
    .object({
      id: z.string().uuid(),
      planId: z.string().uuid(),
      planName: z.string().nullable().optional(),
      planCode: z.string().nullable().optional(),
      status: z.string(),
      seatCount: z.number(),
      currentPeriodStart: z.string().optional(),
      currentPeriodEnd: z.string().nullable().optional(),
      cancelAtPeriodEnd: z.boolean().optional(),
      trialEndsAt: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  branding: z
    .object({
      companyName: z.string().nullable().optional(),
      logoUrl: z.string().nullable().optional(),
      logoDarkUrl: z.string().nullable().optional(),
      faviconUrl: z.string().nullable().optional(),
      primaryColor: z.string().nullable().optional(),
      accentColor: z.string().nullable().optional(),
      borderRadius: z.string().nullable().optional(),
      customDomain: z.string().nullable().optional(),
      customDomainStatus: z.string().nullable().optional(),
      supportEmail: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type PlatformTenantDetail = z.infer<typeof platformTenantDetailSchema>;

export const provisionTenantSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  legalName: z.string().trim().max(200).optional(),
  tenantCode: z.string().trim().max(50).optional(),
  country: z.string().trim().optional(),
  region: z.string().trim().max(100).optional(),
  timezone: z.string().trim().min(1, "Timezone is required"),
  locale: z.string().trim().default("en-US").optional(),
  currency: z.string().trim().default("USD").optional(),
  supportEmail: z.string().trim().email("Enter a valid support email").optional().or(z.literal("")),
  supportPhone: z.string().trim().max(30).optional(),
  billingEmail: z.string().trim().email("Enter a valid billing email").optional().or(z.literal("")),
  internalNote: z.string().trim().max(1000).optional(),
  ownerEmail: z.string().trim().email("Enter a valid owner email address"),
  ownerFirstName: z.string().trim().max(50).optional(),
  ownerLastName: z.string().trim().max(50).optional(),
  plan: z.string().trim().min(1, "Subscription tier is required"),
  trialDays: z.coerce.number().int().min(0).max(365).optional(),
  databaseMode: z.enum(["shared", "dedicated"]),
  notes: z.string().trim().max(500).optional(),
  branding: z
    .object({
      displayName: z.string().trim().max(100).optional(),
      logoUrl: z.string().trim().url().optional().or(z.literal("")),
      faviconUrl: z.string().trim().url().optional().or(z.literal("")),
      primaryColor: z.string().trim().optional(),
      secondaryColor: z.string().trim().optional(),
    })
    .optional(),
  databaseConfig: z
    .object({
      databaseName: z.string().trim().max(63).optional(),
      poolLimit: z.coerce.number().int().min(1).max(50).optional(),
      databaseKey: z.string().trim().max(100).optional(),
      connectionUrl: z.string().trim().url().or(z.literal("")).optional(),
    })
    .optional(),
});

export type ProvisionTenantInput = z.infer<typeof provisionTenantSchema>;

export const updatePlatformTenantSchema = z.object({
  name: z.string().trim().min(2).optional(),
  plan: z.string().trim().optional(),
  databaseMode: z.enum(["shared", "dedicated"]).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type UpdatePlatformTenantInput = z.infer<typeof updatePlatformTenantSchema>;

export const suspendTenantSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

export type SuspendTenantInput = z.infer<typeof suspendTenantSchema>;

export const updatePlatformTenantSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  seatCount: z.number().int().min(1).optional(),
  status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED"]).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodEnd: z.string().optional(),
});

export type UpdatePlatformTenantSubscriptionInput = z.infer<
  typeof updatePlatformTenantSubscriptionSchema
>;

// ==========================================
// 8. Tenant Database Operations
// ==========================================

export const tenantDatabaseHealthSchema = z.object({
  status: z.enum(["HEALTHY", "UNHEALTHY", "UNKNOWN"]),
  latencyMs: z.number().nullable().optional(),
  lastCheckedAt: z.string().nullable().optional(),
});

export const tenantDatabaseItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  tenantCode: z.string().nullable().optional(),
  region: z.string(),
  strategy: z.enum(["shared", "dedicated"]),
  databaseKey: z.string(),
  databaseName: z.string(),
  schemaVersion: z.string(),
  provisioningStatus: z.enum([
    "ACTIVE",
    "PENDING",
    "PROVISIONING",
    "FAILED",
    "SUSPENDED",
    "DEACTIVATED",
  ]),
  provisioningStep: z.string().nullable().optional(),
  provisioningError: z.string().nullable().optional(),
  migrationStatus: z.enum(["UP_TO_DATE", "PENDING", "MIGRATING", "FAILED"]),
  lastMigrationAt: z.string().nullable().optional(),
  health: tenantDatabaseHealthSchema,
  maintenanceWindow: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TenantDatabaseItem = z.infer<typeof tenantDatabaseItemSchema>;

export const listTenantDatabasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  search: z.string().trim().optional(),
  tenantId: z.string().uuid().optional(),
  strategy: z.enum(["shared", "dedicated", "ALL"]).optional(),
  provisioningStatus: z
    .enum(["ACTIVE", "PENDING", "PROVISIONING", "FAILED", "SUSPENDED", "DEACTIVATED", "ALL"])
    .optional(),
  region: z.string().trim().optional(),
  schemaVersion: z.string().trim().optional(),
  migrationStatus: z.enum(["UP_TO_DATE", "PENDING", "MIGRATING", "FAILED", "ALL"]).optional(),
  healthStatus: z.enum(["HEALTHY", "UNHEALTHY", "UNKNOWN", "ALL"]).optional(),
});

export type ListTenantDatabasesQuery = z.infer<typeof listTenantDatabasesQuerySchema>;

export const executeTenantDatabaseOperationSchema = z.object({
  action: z.enum([
    "PROVISION",
    "RETRY_PROVISIONING",
    "MIGRATE",
    "HEALTH_CHECK",
    "BACKUP",
    "RESTORE",
    "ROLLBACK",
  ]),
  targetVersion: z.string().trim().max(50).optional(),
  maintenanceWindow: z.string().trim().max(100).optional(),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
  backupConfirmed: z.boolean().default(false).optional(),
  poolLimit: z.coerce.number().int().min(1).max(50).optional(),
  customDatabaseName: z.string().trim().max(63).optional(),
  connectionUrl: z.string().trim().url().or(z.literal("")).optional(),
});

export type ExecuteTenantDatabaseOperationInput = z.infer<
  typeof executeTenantDatabaseOperationSchema
>;
