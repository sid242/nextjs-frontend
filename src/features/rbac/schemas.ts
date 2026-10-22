import { z } from "zod";

export const permissionSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  action: z.string().optional(),
  category: z.string().optional().nullable(),
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
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()),
  isSystem: z.boolean().default(false),
  usersCount: z.number().default(0),
  userCount: z.number().optional(),
});
export type Role = z.infer<typeof roleSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
