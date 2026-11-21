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
  isFeatured: z.boolean().default(false).optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).default([]).optional(),
  pricePerSeatMinor: z.number().int().default(0).optional(),
  includedSeats: z.number().int().default(1).optional(),
  version: z.number().int().default(1).optional(),
  ctaLabel: z.string().nullable().optional(),
  entitlements: planEntitlementsSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type Plan = z.infer<typeof planSchema>;

const catalogPlanPayloadSchema = planSchema.omit({ priceCents: true, entitlements: true }).extend({
  priceCents: z.number().int().optional(),
  priceMonthlyMinor: z.number().int().optional(),
  priceYearlyMinor: z.number().int().optional(),
  entitlements: z.unknown().optional(),
});

export const catalogPlanSchema = catalogPlanPayloadSchema.transform(
  ({ priceCents, priceMonthlyMinor, priceYearlyMinor, entitlements, ...plan }): Plan => {
    const legacyEntitlements = planEntitlementsSchema.safeParse(entitlements);
    return {
      ...plan,
      priceCents:
        priceCents ??
        (plan.billingInterval === "ANNUAL" ? priceYearlyMinor : priceMonthlyMinor) ??
        0,
      entitlements: legacyEntitlements.success ? legacyEntitlements.data : undefined,
    };
  },
);

export const tenantSubscriptionUsageSchema = z.object({
  activeMembers: z.number().int(),
  maxMembers: z.number().int().nullable(),
  remainingSeats: z.number().int().nullable(),
  occupiedSeats: z.number().int().optional(),
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
  priceSnapshotMinor: z.number().int().nullable().optional(),
  currency: z.string().default("INR").optional(),
  pausedAt: z.string().nullable().optional(),
  canceledAt: z.string().nullable().optional(),
  cancelReason: z.string().nullable().optional(),
  defaultPaymentMethodId: z.string().nullable().optional(),
  couponId: z.string().nullable().optional(),
  scheduledPlanId: z.string().nullable().optional(),
  taxIdSnapshot: z.string().nullable().optional(),
  plan: planSchema.nullable().optional(),
  usage: tenantSubscriptionUsageSchema,
});

export type TenantSubscription = z.infer<typeof tenantSubscriptionSchema>;

export const tenantBillingOverviewSchema = z
  .object({
    subscription: tenantSubscriptionSchema
      .omit({ usage: true, plan: true })
      .extend({
        plan: catalogPlanPayloadSchema.nullable().optional(),
        billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]).optional(),
      })
      .nullable(),
    usage: tenantSubscriptionUsageSchema.partial().extend({ members: z.number().int() }),
    limits: z.object({ maxMembers: z.number().int().nullable() }).optional(),
  })
  .transform(({ subscription, usage, limits }): TenantSubscription | null => {
    if (!subscription) return null;
    const { billingInterval, plan, ...details } = subscription;
    const maxMembers = usage.maxMembers ?? limits?.maxMembers ?? null;
    return {
      ...details,
      plan:
        plan &&
        catalogPlanSchema.parse({
          ...plan,
          billingInterval: billingInterval ?? plan.billingInterval,
          priceCents: subscription.priceSnapshotMinor ?? plan.priceCents,
          currency: subscription.currency ?? plan.currency,
        }),
      usage: {
        activeMembers: usage.activeMembers ?? usage.members,
        occupiedSeats: usage.members,
        maxMembers,
        remainingSeats:
          usage.remainingSeats ??
          (maxMembers === null ? null : Math.max(0, maxMembers - usage.members)),
      },
    };
  });

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

export const assignSubscriptionSchema = z.object({
  tenantId: z.string().uuid("Please select a tenant"),
  planKey: z.string().trim().min(1, "Please select a plan"),
  startDate: z.string().optional(),
  isTrial: z.boolean(),
  trialEndsAt: z.string().optional(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  billingEmail: z.string().email("Invalid billing email").optional().or(z.literal("")),
  seatCount: z.coerce.number().int().min(1, "Minimum 1 seat"),
  prorate: z.boolean(),
  internalNotes: z.string().trim().max(1000).optional(),
});

export type AssignSubscriptionInput = z.infer<typeof assignSubscriptionSchema>;

export const planFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  billingInterval: z.enum(["ALL", "MONTHLY", "ANNUAL", "LIFETIME"]).default("ALL"),
  currency: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  entitlement: z.string().optional(),
});

export type PlanFilters = z.infer<typeof planFiltersSchema>;

export const subscriptionFiltersSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["ALL", "TRIALING", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELED", "EXPIRED"])
    .default("ALL"),
  billingInterval: z.enum(["ALL", "MONTHLY", "ANNUAL", "LIFETIME"]).default("ALL"),
  provider: z.string().optional(),
  planKey: z.string().optional(),
});

export type SubscriptionFilters = z.infer<typeof subscriptionFiltersSchema>;

export const tenantEntitlementOverrideSchema = z.object({
  entitlementKey: z.string().trim().min(1, "Entitlement key is required"),
  value: z.union([z.string(), z.number(), z.boolean()]),
  expiresAt: z.string().optional().nullable(),
  reason: z.string().trim().max(500).optional(),
});

export type TenantEntitlementOverrideInput = z.infer<typeof tenantEntitlementOverrideSchema>;

export interface EntitlementDefinition {
  key: string;
  label: string;
  description: string;
  type: "INTEGER" | "BOOLEAN" | "STRING";
  unit?: string | null;
  defaultValue: unknown;
  validation?: Record<string, unknown> | null;
}

export interface PlatformSubscriptionItem {
  subscription: {
    id: string;
    tenantId: string;
    planId: string;
    status: string;
    billingInterval: string;
    provider: string;
    seatCount: number;
    billingEmail?: string | null;
    currentPeriodStart: string;
    currentPeriodEnd?: string | null;
    trialEndsAt?: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt?: string | null;
    internalNotes?: string | null;
    createdAt: string;
    updatedAt?: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    key: string;
    name: string;
    priceMonthlyMinor: number;
    currency: string;
  };
}

export interface PlatformSubscriptionsResponse {
  subscriptions: PlatformSubscriptionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantEntitlementOverrideResult {
  tenantId: string;
  entitlementKey: string;
  value: unknown;
  expiresAt?: string | null;
  reason?: string | null;
}
