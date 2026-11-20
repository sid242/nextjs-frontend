import { api } from "@/lib/api/http";

import type {
  CreateApiKeyValues,
  CreateWebhookEndpointValues,
  UpdateWebhookEndpointValues,
} from "./schemas";
import type {
  ApiKeyItem,
  CreatedApiKeyResult,
  CreatedWebhookEndpointResult,
  RotatedApiKeyResult,
  WebhookDeliveryItem,
  WebhookEndpointItem,
} from "./types";

// ─── API Keys API ────────────────────────────────────────────────────────────

export const listApiKeys = (tenantId: string) =>
  api.get<{ items: ApiKeyItem[]; total: number }>(`/tenants/${tenantId}/developers/api-keys`);

export const createApiKey = (tenantId: string, values: CreateApiKeyValues) => {
  const allowedIps = values.allowedIps
    ? values.allowedIps
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return api.post<CreatedApiKeyResult>(`/tenants/${tenantId}/developers/api-keys`, {
    name: values.name,
    scopes: values.scopes,
    rateLimitPerMin: values.rateLimitPerMin,
    allowedIps,
    expiresInDays: values.expiresInDays,
  });
};

export const rotateApiKey = (tenantId: string, keyId: string) =>
  api.post<RotatedApiKeyResult>(`/tenants/${tenantId}/developers/api-keys/${keyId}/rotate`);

export const revokeApiKey = (tenantId: string, keyId: string) =>
  api.delete<{ id: string; revoked: boolean }>(`/tenants/${tenantId}/developers/api-keys/${keyId}`);

// ─── Webhooks API ────────────────────────────────────────────────────────────

export const listWebhookEndpoints = (tenantId: string) =>
  api.get<{ items: WebhookEndpointItem[]; total: number }>(
    `/tenants/${tenantId}/developers/webhooks`,
  );

export const createWebhookEndpoint = (tenantId: string, values: CreateWebhookEndpointValues) =>
  api.post<CreatedWebhookEndpointResult>(`/tenants/${tenantId}/developers/webhooks`, values);

export const updateWebhookEndpoint = (
  tenantId: string,
  endpointId: string,
  values: UpdateWebhookEndpointValues,
) =>
  api.patch<WebhookEndpointItem>(`/tenants/${tenantId}/developers/webhooks/${endpointId}`, values);

export const deleteWebhookEndpoint = (tenantId: string, endpointId: string) =>
  api.delete<{ id: string; deleted: boolean }>(
    `/tenants/${tenantId}/developers/webhooks/${endpointId}`,
  );

export const rotateWebhookSecret = (tenantId: string, endpointId: string) =>
  api.post<{ secret: string }>(
    `/tenants/${tenantId}/developers/webhooks/${endpointId}/rotate-secret`,
  );

export const sendTestWebhook = (tenantId: string, endpointId: string) =>
  api.post<{ deliveryId: string; status: string }>(
    `/tenants/${tenantId}/developers/webhooks/${endpointId}/test`,
  );

export const listWebhookDeliveries = (tenantId: string, endpointId: string) =>
  api.get<{ items: WebhookDeliveryItem[]; total: number }>(
    `/tenants/${tenantId}/developers/webhooks/${endpointId}/deliveries`,
  );

export const redeliverWebhook = (tenantId: string, deliveryId: string) =>
  api.post<{ deliveryId: string; status: string }>(
    `/tenants/${tenantId}/developers/webhooks/deliveries/${deliveryId}/redeliver`,
  );
