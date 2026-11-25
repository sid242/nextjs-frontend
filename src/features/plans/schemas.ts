import { z } from "zod";

export const planEntitlementsSchema = z.object({
  id: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  maxMembers: z.number().int().min(1),
  maxProjects: z.number().int().min(1),
  maxStorageMb: z.number().int().min(100),
  hasCustomRoles: z.boolean(),
  hasAdvancedAnalytics: z.boolean(),
  hasPrioritySupport: z.boolean(),
  hasAuditRetentionDays: z.number().int().min(1),
});

export type PlanEntitlements = z.infer<typeof planEntitlementsSchema>;

export const PLAN_CURRENCY_OPTIONS = [
  { label: "INR - Indian Rupee (₹)", value: "INR" },
  { label: "USD - United States Dollar ($)", value: "USD" },
  { label: "EUR - Euro (€)", value: "EUR" },
  { label: "GBP - British Pound (£)", value: "GBP" },
  { label: "CAD - Canadian Dollar (CA$)", value: "CAD" },
] as const;

export const planLimitsSchema = z.object({
  maxMembers: z.number().int().nullable().optional(),
  maxStorageBytes: z.number().int().nullable().optional(),
  maxCustomRoles: z.number().int().nullable().optional(),
});

export type PlanLimits = z.infer<typeof planLimitsSchema>;

function toPositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.round(value);
  }
  return undefined;
}

/**
 * Normalizes both backend dot-key entitlement maps (e.g. `members.max`, `storage.gb`)
 * with `Plan.limits` fallbacks and legacy camelCase entitlement records into `PlanEntitlements`.
 */
export function normalizePlanEntitlements(
  rawEntitlements: unknown,
  rawLimits?: PlanLimits | null,
): PlanEntitlements | undefined {
  const direct = planEntitlementsSchema.safeParse(rawEntitlements);
  if (direct.success) {
    return direct.data;
  }

  const record =
    rawEntitlements && typeof rawEntitlements === "object" && !Array.isArray(rawEntitlements)
      ? (rawEntitlements as Record<string, unknown>)
      : {};

  const hasRecordKeys = Object.keys(record).length > 0;
  if (!hasRecordKeys && !rawLimits) {
    return undefined;
  }

  const storageFromGb =
    typeof record["storage.gb"] === "number" && Number.isFinite(record["storage.gb"])
      ? Math.round(record["storage.gb"] * 1024)
      : undefined;
  const storageFromBytes =
    typeof rawLimits?.maxStorageBytes === "number" && Number.isFinite(rawLimits.maxStorageBytes)
      ? Math.round(rawLimits.maxStorageBytes / (1024 * 1024))
      : undefined;

  const candidate: PlanEntitlements = {
    maxMembers:
      toPositiveInt(record.maxMembers) ??
      toPositiveInt(record["members.max"]) ??
      toPositiveInt(rawLimits?.maxMembers) ??
      5,
    maxProjects: toPositiveInt(record.maxProjects) ?? toPositiveInt(record["projects.max"]) ?? 10,
    maxStorageMb: Math.max(
      100,
      toPositiveInt(record.maxStorageMb) ?? storageFromGb ?? storageFromBytes ?? 1024,
    ),
    hasCustomRoles: Boolean(
      record.hasCustomRoles ??
      record["groups.enabled"] ??
      (rawLimits?.maxCustomRoles === null || (rawLimits?.maxCustomRoles ?? 0) > 2),
    ),
    hasAdvancedAnalytics: Boolean(
      record.hasAdvancedAnalytics ?? record["api_access.enabled"] ?? record["audit.export"],
    ),
    hasPrioritySupport: Boolean(record.hasPrioritySupport ?? record["sso.saml"]),
    hasAuditRetentionDays:
      toPositiveInt(record.hasAuditRetentionDays) ??
      toPositiveInt(record["audit.retention_days"]) ??
      30,
  };

  const normalized = planEntitlementsSchema.safeParse(candidate);
  return normalized.success ? normalized.data : undefined;
}

export const planSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  priceCents: z.number().int(),
  priceMonthlyMinor: z.number().int().optional(),
  priceYearlyMinor: z.number().int().optional(),
  currency: z.string(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  isFeatured: z.boolean().optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  pricePerSeatMinor: z.number().int().optional(),
  includedSeats: z.number().int().optional(),
  version: z.number().int().optional(),
  ctaLabel: z.string().nullable().optional(),
  limits: planLimitsSchema.nullable().optional(),
  entitlements: planEntitlementsSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type Plan = z.infer<typeof planSchema>;

const catalogPlanPayloadSchema = planSchema.omit({ priceCents: true, entitlements: true }).extend({
  priceCents: z.number().int().optional(),
  priceMonthlyMinor: z.number().int().optional(),
  priceYearlyMinor: z.number().int().optional(),
  limits: z.unknown().optional(),
  entitlements: z.unknown().optional(),
});

export const catalogPlanSchema = catalogPlanPayloadSchema.transform(
  ({ priceCents, priceMonthlyMinor, priceYearlyMinor, limits, entitlements, ...plan }): Plan => {
    const parsedLimits = planLimitsSchema.safeParse(limits);
    const normalizedLimits = parsedLimits.success ? parsedLimits.data : null;
    const normalizedCurrency = (plan.currency || "USD").trim().toUpperCase();
    return {
      ...plan,
      currency: normalizedCurrency,
      priceMonthlyMinor,
      priceYearlyMinor,
      priceCents:
        priceCents ??
        (plan.billingInterval === "ANNUAL" ? priceYearlyMinor : priceMonthlyMinor) ??
        0,
      limits: normalizedLimits,
      entitlements: normalizePlanEntitlements(entitlements, normalizedLimits),
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
  currency: z.string().optional(),
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
  priceCents: z.number().int().min(0, "Price cannot be negative"),
  currency: z.string().trim().length(3),
  billingInterval: z.enum(["MONTHLY", "ANNUAL", "LIFETIME"]),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  entitlements: planEntitlementsSchema.optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const changeSubscriptionSchema = z.object({
  planKey: z.string().trim().min(1, "Select a target plan"),
  seatCount: z.number().int().min(1).max(1000),
});

export type ChangeSubscriptionInput = z.infer<typeof changeSubscriptionSchema>;

export const updatePlanSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  priceCents: z.number().int().min(0, "Price cannot be negative"),
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
  seatCount: z.number().int().min(1, "Minimum 1 seat"),
  prorate: z.boolean(),
  internalNotes: z.string().trim().max(1000).optional(),
});

export type AssignSubscriptionInput = z.infer<typeof assignSubscriptionSchema>;

export const planFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  billingInterval: z.enum(["ALL", "MONTHLY", "ANNUAL", "LIFETIME"]).default("ALL"),
  currency: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
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
