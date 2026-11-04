import { z } from "zod";

export const ssoProviderTypeSchema = z.enum(["SAML", "OIDC"]);
export const ssoStatusSchema = z.enum(["DISABLED", "ACTIVE"]);
export const scimTokenStatusSchema = z.enum(["ACTIVE", "REVOKED"]);

export const tenantSsoConfigSchema = z.object({
  tenantId: z.string().uuid(),
  providerType: ssoProviderTypeSchema.default("SAML"),
  status: ssoStatusSchema.default("DISABLED"),
  idpEntityId: z.string().nullable().optional(),
  idpSsoUrl: z.string().nullable().optional(),
  idpCertificate: z.string().nullable().optional(),
  oidcClientId: z.string().nullable().optional(),
  oidcClientSecret: z.string().nullable().optional(),
  oidcDiscoveryUrl: z.string().nullable().optional(),
  enforceSso: z.boolean().default(false),
  allowedDomains: z.array(z.string()).default([]),
  defaultRoleId: z.string().nullable().optional(),
  jitProvisioning: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateTenantSsoConfigSchema = z.object({
  providerType: ssoProviderTypeSchema.default("SAML"),
  status: ssoStatusSchema.default("DISABLED"),
  idpEntityId: z.string().trim().min(1, "IdP Entity ID is required").optional().nullable(),
  idpSsoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  idpCertificate: z.string().trim().optional().nullable(),
  oidcClientId: z.string().trim().optional().nullable(),
  oidcClientSecret: z.string().trim().optional().nullable(),
  oidcDiscoveryUrl: z.string().url("Must be a valid URL").optional().nullable(),
  enforceSso: z.boolean().default(false),
  allowedDomains: z.array(z.string().trim().toLowerCase()).default([]),
  defaultRoleId: z.string().uuid().optional().nullable(),
  jitProvisioning: z.boolean().default(true),
});

export const testSsoConnectionSchema = z.object({
  providerType: ssoProviderTypeSchema,
  idpEntityId: z.string().optional().nullable(),
  idpSsoUrl: z.string().url("Must be a valid URL").optional().nullable(),
  idpCertificate: z.string().optional().nullable(),
  oidcDiscoveryUrl: z.string().url("Must be a valid URL").optional().nullable(),
});

export const scimTokenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tokenPrefix: z.string(),
  status: scimTokenStatusSchema,
  lastUsedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const createScimTokenSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
});

export const createScimTokenResponseSchema = z.object({
  rawToken: z.string(),
  token: scimTokenSchema,
});

export const ssoLookupResponseSchema = z.object({
  ssoAvailable: z.boolean(),
  tenantId: z.string().optional(),
  tenantSlug: z.string().optional(),
  tenantName: z.string().optional(),
  enforceSso: z.boolean().optional(),
  providerType: ssoProviderTypeSchema.optional(),
});
