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
  reason: z.string(),
  status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED"]),
  expiresAt: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable().optional(),
});

export type PlatformSupportSession = z.infer<typeof supportSessionSchema>;

export const startSupportSessionSchema = z.object({
  tenantId: z.string().uuid("Valid customer tenant ID required"),
  reason: z.string().trim().min(5, "Support reason must be at least 5 characters"),
  durationMinutes: z.coerce.number().int().min(5).max(120).default(30),
});

export type StartSupportSessionInput = z.infer<typeof startSupportSessionSchema>;

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
