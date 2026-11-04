import { z } from "zod";

export const permissionRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type PermissionRiskLevel = z.infer<typeof permissionRiskLevelSchema>;

export const permissionSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  code: z.string().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  scope: z.enum(["TENANT", "PLATFORM"]).default("TENANT").optional(),
  resource: z.string().optional().nullable(),
  action: z.string().optional(),
  category: z.string().optional().nullable(),
  riskLevel: permissionRiskLevelSchema.default("LOW").optional(),
  isSystem: z.boolean().default(true).optional(),
  isAssignable: z.boolean().default(true).optional(),
});
export type Permission = z.infer<typeof permissionSchema>;

export const appModuleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  isSystem: z.boolean().default(false),
  permissions: z.array(permissionSchema).default([]),
});
export type AppModule = z.infer<typeof appModuleSchema>;

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  scope: z.enum(["TENANT", "PLATFORM"]).default("TENANT").optional(),
  isActive: z.boolean().default(true).optional(),
  isSystem: z.boolean().default(false),
  permissions: z.array(z.string()),
  assignedUsersCount: z.number().optional(),
  assignedGroupsCount: z.number().default(0).optional(),
  usersCount: z.number().default(0),
  userCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Role = z.infer<typeof roleSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Role code must be at least 2 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Role code must be alphanumeric with underscores or dashes")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  scope: z.enum(["TENANT", "PLATFORM"]).default("TENANT").optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  isActive: z.boolean().default(true).optional(),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const listRolesFilterSchema = z.object({
  search: z.string().optional(),
  scope: z.enum(["TENANT", "PLATFORM", "ALL"]).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "ALL"]).optional(),
  isSystem: z.enum(["true", "false", "all"]).optional(),
  module: z.string().optional(),
  permission: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});
export type ListRolesFilter = z.infer<typeof listRolesFilterSchema>;
