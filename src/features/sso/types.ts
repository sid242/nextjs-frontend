import { z } from "zod";

import {
  createScimTokenResponseSchema,
  createScimTokenSchema,
  scimTokenSchema,
  scimTokenStatusSchema,
  ssoLookupResponseSchema,
  ssoProviderTypeSchema,
  ssoStatusSchema,
  tenantSsoConfigSchema,
  testSsoConnectionSchema,
  updateTenantSsoConfigSchema,
} from "./schemas";

export type SsoProviderType = z.infer<typeof ssoProviderTypeSchema>;
export type SsoStatus = z.infer<typeof ssoStatusSchema>;
export type ScimTokenStatus = z.infer<typeof scimTokenStatusSchema>;

export type TenantSsoConfig = z.infer<typeof tenantSsoConfigSchema>;
export type UpdateTenantSsoConfigInput = z.infer<typeof updateTenantSsoConfigSchema>;
export type TestSsoConnectionInput = z.infer<typeof testSsoConnectionSchema>;

export type ScimToken = z.infer<typeof scimTokenSchema>;
export type CreateScimTokenInput = z.infer<typeof createScimTokenSchema>;
export type CreateScimTokenResponse = z.infer<typeof createScimTokenResponseSchema>;
export type SsoLookupResponse = z.infer<typeof ssoLookupResponseSchema>;
