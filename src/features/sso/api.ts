import { api } from "@/lib/api/http";
import { buildQueryString } from "@/lib/utils";

import type {
  CreateScimTokenInput,
  CreateScimTokenResponse,
  ScimToken,
  SsoLookupResponse,
  TenantSsoConfig,
  TestSsoConnectionInput,
  UpdateTenantSsoConfigInput,
} from "./types";

export async function getTenantSsoConfig(
  tenantId: string,
  signal?: AbortSignal,
): Promise<TenantSsoConfig> {
  return api.get<TenantSsoConfig>(`/tenants/${tenantId}/sso`, { signal });
}

export async function updateTenantSsoConfig(
  tenantId: string,
  input: UpdateTenantSsoConfigInput,
): Promise<TenantSsoConfig> {
  return api.put<TenantSsoConfig>(`/tenants/${tenantId}/sso`, input);
}

export async function testSsoConnection(
  tenantId: string,
  input: TestSsoConnectionInput,
): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
  return api.post<{ success: boolean; message: string; details?: Record<string, unknown> }>(
    `/tenants/${tenantId}/sso/test`,
    input,
  );
}

export async function listScimTokens(tenantId: string, signal?: AbortSignal): Promise<ScimToken[]> {
  return api.get<ScimToken[]>(`/tenants/${tenantId}/scim/tokens`, { signal });
}

export async function createScimToken(
  tenantId: string,
  input: CreateScimTokenInput,
): Promise<CreateScimTokenResponse> {
  return api.post<CreateScimTokenResponse>(`/tenants/${tenantId}/scim/tokens`, input);
}

export async function revokeScimToken(
  tenantId: string,
  tokenId: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete<{ success: boolean; message: string }>(
    `/tenants/${tenantId}/scim/tokens/${tokenId}`,
  );
}

export async function lookupSso(email: string): Promise<SsoLookupResponse> {
  return api.post<SsoLookupResponse>("/auth/sso/lookup", { email });
}

export async function initiateSso(params: {
  email?: string;
  tenantId?: string;
  tenantSlug?: string;
  returnTo?: string;
}): Promise<{ redirectUrl: string; providerType: string }> {
  const qs = buildQueryString(params);
  return api.get<{ redirectUrl: string; providerType: string }>(`/auth/sso/initiate${qs}`);
}
