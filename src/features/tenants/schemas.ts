import { z } from "zod";

export const tenantPlanSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);
export type TenantPlan = z.infer<typeof tenantPlanSchema>;

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tenant name is required"),
  slug: z.string().min(1),
  plan: tenantPlanSchema.default("PRO"),
  logoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type Tenant = z.infer<typeof tenantSchema>;

export const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const tenantFontFamilySchema = z.enum([
  "Inter",
  "Plus Jakarta Sans",
  "Geist",
  "Poppins",
  "Outfit",
  "Roboto",
]);
export type TenantFontFamily = z.infer<typeof tenantFontFamilySchema>;

export const tenantSidebarThemeSchema = z.enum(["DARK", "LIGHT", "BRAND"]);
export type TenantSidebarTheme = z.infer<typeof tenantSidebarThemeSchema>;

export const customDomainStatusSchema = z.enum(["PENDING", "VERIFIED", "ACTIVE", "FAILED"]);
export type CustomDomainStatus = z.infer<typeof customDomainStatusSchema>;

export const tenantUrlStyleSchema = z.enum(["path", "subdomain", "customDomain"]);
export type TenantUrlStyle = z.infer<typeof tenantUrlStyleSchema>;

export const tenantUrlAccessSchema = z.object({
  path: z.literal(true),
  subdomain: z.boolean(),
  customDomain: z.boolean(),
});
export type TenantUrlAccess = z.infer<typeof tenantUrlAccessSchema>;

export const tenantUrlSettingsSchema = z.object({
  urlStyle: tenantUrlStyleSchema,
  effective: tenantUrlStyleSchema,
  allowed: tenantUrlAccessSchema,
  canonicalBase: z.string(),
  reason: z.enum(["PLAN", "UNVERIFIED", "SUSPENDED", "ENV_DISABLED"]).optional(),
  customDomain: z.string().nullable().optional(),
  status: customDomainStatusSchema.nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  instructions: z.object({
    txtRecord: z.string().nullable().optional(),
    cnameTarget: z.string().optional(),
  }),
  urls: z.object({
    path: z.string(),
    subdomain: z.string().optional(),
    customDomain: z.string().optional(),
  }),
});
export type TenantUrlSettings = z.infer<typeof tenantUrlSettingsSchema>;

export const updateTenantUrlSettingsSchema = z.object({
  urlStyle: tenantUrlStyleSchema.optional(),
  customDomain: z.string().trim().nullable().optional().or(z.literal("")),
});
export type UpdateTenantUrlSettingsInput = z.infer<typeof updateTenantUrlSettingsSchema>;

export const tenantBrandingSchema = z.object({
  tenantId: z.string().optional(),
  companyName: z.string().min(1).default("Acme Corporation"),
  logoUrl: z.string().nullable().optional(),
  logoDarkUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  primaryColor: z.string().regex(hexColorRegex, "Invalid hex color").default("#0ea5e9"),
  accentColor: z.string().regex(hexColorRegex, "Invalid hex color").default("#38bdf8"),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid hex color").nullable().optional(),
  primaryDarkColor: z.string().regex(hexColorRegex, "Invalid hex color").nullable().optional(),
  accentDarkColor: z.string().regex(hexColorRegex, "Invalid hex color").nullable().optional(),
  secondaryDarkColor: z.string().regex(hexColorRegex, "Invalid hex color").nullable().optional(),
  fontFamily: tenantFontFamilySchema.default("Inter"),
  sidebarTheme: tenantSidebarThemeSchema.default("DARK"),
  borderRadius: z.string().optional(),
  customDomain: z.string().nullable().optional(),
  customDomainStatus: customDomainStatusSchema.nullable().optional(),
  customDomainVerifiedAt: z.string().nullable().optional(),
  customDomainTlsStatus: z.string().nullable().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
});
export type TenantBranding = z.infer<typeof tenantBrandingSchema>;

export const updateTenantBrandingSchema = tenantBrandingSchema.partial();
export type UpdateTenantBrandingInput = z.infer<typeof updateTenantBrandingSchema>;

export const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes"),
  plan: tenantPlanSchema.default("PRO"),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  plan: tenantPlanSchema.optional(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const tenantModuleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
});
export type TenantModule = z.infer<typeof tenantModuleSchema>;

export const tenantMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).default("ACTIVE"),
  role: z.string().default("MEMBER"),
  joinedAt: z.string().optional(),
});
export type TenantMember = z.infer<typeof tenantMemberSchema>;

export const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.string().min(1, "Role is required").default("MEMBER"),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const tenantEmailConfigSchema = z.object({
  host: z.string().min(1, "SMTP Host is required"),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  user: z.string().min(1, "SMTP Username is required"),
  password: z.string().optional(),
  passwordConfigured: z.boolean().optional(),
  fromEmail: z.string().email("Valid from email is required"),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
  isEnabled: z.boolean().default(true),
});
export type TenantEmailConfig = z.infer<typeof tenantEmailConfigSchema>;

export const testEmailSchema = z.object({
  targetEmail: z.string().email("Valid recipient email is required"),
  host: z.string().optional(),
  port: z.coerce.number().int().optional(),
  secure: z.boolean().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().optional(),
  fromName: z.string().optional(),
});
export type TestEmailInput = z.infer<typeof testEmailSchema>;

export const auditLogSchema = z.object({
  id: z.string(),
  actor: z.string().optional().nullable(),
  action: z.string(),
  ip: z.string().optional().nullable(),
  resource: z.string().optional().nullable(),
  details: z.any().optional(),
  createdAt: z.string(),
  status: z.enum(["SUCCESS", "WARNING", "FAILED"]).default("SUCCESS"),
});
export type AuditLogEntry = z.infer<typeof auditLogSchema>;

export const searchAuditLogsSchema = z.object({
  search: z.string().optional(),
  action: z.string().optional(),
  actions: z.array(z.string()).optional(),
  status: z.enum(["SUCCESS", "WARNING", "FAILED", "ALL"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type SearchAuditLogsInput = z.infer<typeof searchAuditLogsSchema>;

export interface TenantContext {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    databaseMode?: string;
    urlStyle?: string;
    urlAccess?: TenantUrlAccess;
    urlMode?: TenantUrlStyle;
    effectiveUrl?: string;
  };
  membership?: {
    id: string;
    status: string;
    roles: string[];
  };
  permissions: string[];
}
