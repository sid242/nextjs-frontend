import { z } from "zod";

// ==========================================
// 1. Staff Members
// ==========================================

export const staffMemberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]),
  roleId: z.string().uuid(),
  roleKey: z.string().nullable().optional(),
  roleName: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type StaffMember = z.infer<typeof staffMemberSchema>;

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
  durationMinutes: z.coerce.number().int().min(5).max(120),
});

export type StartSupportSessionInput = z.infer<typeof startSupportSessionSchema>;

export interface StartSupportSessionResponse {
  sessionId: string;
  tenantId: string;
  targetUserId?: string | null;
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
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIALING", "DEACTIVATED"]),
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
  ownerEmail: z.string().trim().email("Enter a valid owner email address"),
  plan: z.string().trim().min(1, "Subscription tier is required"),
  country: z.string().trim().optional(),
  timezone: z.string().trim().min(1, "Timezone is required"),
  databaseMode: z.enum(["shared", "dedicated"]),
  notes: z.string().trim().max(500).optional(),
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
