export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rateLimitPerMin: number;
  allowedIps: string[] | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedApiKeyResult {
  id: string;
  name: string;
  prefix: string;
  rawKey: string;
  scopes: string[];
  rateLimitPerMin: number;
  allowedIps: string[] | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface RotatedApiKeyResult {
  id: string;
  prefix: string;
  rawKey: string;
}

export interface WebhookEndpointItem {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  status: "ACTIVE" | "DISABLED";
  failureCount: number;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedWebhookEndpointResult extends WebhookEndpointItem {
  secret: string;
}

export interface WebhookDeliveryItem {
  id: string;
  endpointId: string;
  event: string;
  deliveryStatus: "PENDING" | "SUCCESS" | "FAILED";
  httpStatus: number | null;
  responseBody: string | null;
  error: string | null;
  attemptNumber: number;
  durationMs: number | null;
  deliveredAt: string | null;
  createdAt: string;
}
