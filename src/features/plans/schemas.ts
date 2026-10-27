import { z } from "zod";

export const planEntitlementsSchema = z.object({
  id: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  maxMembers: z.coerce.number().int().min(1),
  maxProjects: z.coerce.number().int().min(1),
  maxStorageMb: z.coerce.number().int().min(100),
  hasCustomRoles: z.boolean(),
  hasAdvancedAnalytics: z.boolean(),
  hasPrioritySupport: z.boolean(),
  hasAuditRetentionDays: z.coerce.number().int().min(1),
});

export type PlanEntitlements = z.infer<typeof planEntitlementsSchema>;

export const planSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  priceCents: z.number().int(),
  currency: z.string(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  entitlements: planEntitlementsSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type Plan = z.infer<typeof planSchema>;

export const tenantSubscriptionUsageSchema = z.object({
  activeMembers: z.number().int(),
  maxMembers: z.number().int(),
  remainingSeats: z.number().int(),
});

export const tenantSubscriptionSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  tenantId: z.string().uuid(),
  status: z.string(),
  seatCount: z.number().int(),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean(),
  trialEndsAt: z.string().nullable().optional(),
  plan: planSchema.nullable().optional(),
  usage: tenantSubscriptionUsageSchema,
});

export type TenantSubscription = z.infer<typeof tenantSubscriptionSchema>;

export const createPlanSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Key must be at least 2 characters")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Key must be uppercase alphanumeric with underscores"),
  name: z.string().trim().min(2, "Plan name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  priceCents: z.coerce.number().int().min(0, "Price cannot be negative"),
  currency: z.string().trim().length(3),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  entitlements: planEntitlementsSchema.optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const changeSubscriptionSchema = z.object({
  planKey: z.string().trim().min(1, "Select a target plan"),
  seatCount: z.coerce.number().int().min(1).max(1000),
});

export type ChangeSubscriptionInput = z.infer<typeof changeSubscriptionSchema>;

export const updatePlanSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  priceCents: z.coerce.number().int().min(0, "Price cannot be negative"),
  currency: z.string().trim().length(3),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  entitlements: planEntitlementsSchema.optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
