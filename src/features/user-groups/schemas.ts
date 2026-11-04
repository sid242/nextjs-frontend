import { z } from "zod";

export const groupSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(groupSlugRegex, "Slug must be lowercase alphanumeric and single hyphens")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(groupSlugRegex, "Slug must be lowercase alphanumeric and single hyphens")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export type UpdateGroupValues = z.infer<typeof updateGroupSchema>;

export const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid("Invalid member ID")).min(1, "Select at least one member"),
});

export type AddMembersValues = z.infer<typeof addMembersSchema>;

export const bindRoleSchema = z.object({
  roleId: z.string().uuid("Please select a valid role"),
  reason: z.string().trim().max(255).optional(),
});

export type BindRoleValues = z.infer<typeof bindRoleSchema>;
