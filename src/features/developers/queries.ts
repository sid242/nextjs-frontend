"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/errors";

import * as api from "./api";
import { developerKeys } from "./keys";
import type {
  CreateApiKeyValues,
  CreateWebhookEndpointValues,
  UpdateWebhookEndpointValues,
} from "./schemas";

// ─── API Keys Queries & Mutations ────────────────────────────────────────────

export function useApiKeys(tenantId?: string) {
  return useQuery({
    queryKey: developerKeys.apiKeys(tenantId),
    queryFn: () =>
      tenantId ? api.listApiKeys(tenantId) : Promise.resolve({ items: [], total: 0 }),
    enabled: Boolean(tenantId),
  });
}

export function useCreateApiKey(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateApiKeyValues) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.createApiKey(tenantId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys(tenantId) });
      toast.success("API key generated successfully");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create API key"));
    },
  });
}

export function useRotateApiKey(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.rotateApiKey(tenantId, keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys(tenantId) });
      toast.success("API key rotated successfully");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to rotate API key"));
    },
  });
}

export function useRevokeApiKey(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.revokeApiKey(tenantId, keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys(tenantId) });
      toast.success("API key revoked successfully");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to revoke API key"));
    },
  });
}

// ─── Webhooks Queries & Mutations ────────────────────────────────────────────

export function useWebhookEndpoints(tenantId?: string) {
  return useQuery({
    queryKey: developerKeys.webhooks(tenantId),
    queryFn: () =>
      tenantId ? api.listWebhookEndpoints(tenantId) : Promise.resolve({ items: [], total: 0 }),
    enabled: Boolean(tenantId),
  });
}

export function useCreateWebhookEndpoint(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateWebhookEndpointValues) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.createWebhookEndpoint(tenantId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks(tenantId) });
      toast.success("Webhook endpoint created successfully");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create webhook endpoint"));
    },
  });
}

export function useUpdateWebhookEndpoint(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      endpointId,
      values,
    }: {
      endpointId: string;
      values: UpdateWebhookEndpointValues;
    }) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.updateWebhookEndpoint(tenantId, endpointId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks(tenantId) });
      toast.success("Webhook endpoint updated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update webhook endpoint"));
    },
  });
}

export function useDeleteWebhookEndpoint(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.deleteWebhookEndpoint(tenantId, endpointId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks(tenantId) });
      toast.success("Webhook endpoint deleted");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete webhook endpoint"));
    },
  });
}

export function useRotateWebhookSecret(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.rotateWebhookSecret(tenantId, endpointId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks(tenantId) });
      toast.success("Webhook signing secret rotated");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to rotate signing secret"));
    },
  });
}

export function useSendTestWebhook(tenantId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.sendTestWebhook(tenantId, endpointId);
    },
    onSuccess: (_, endpointId) => {
      queryClient.invalidateQueries({ queryKey: developerKeys.deliveries(tenantId, endpointId) });
      toast.success("Test ping dispatched to webhook endpoint");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to send test webhook"));
    },
  });
}

export function useWebhookDeliveries(tenantId?: string, endpointId?: string) {
  return useQuery({
    queryKey: developerKeys.deliveries(tenantId, endpointId),
    queryFn: () =>
      tenantId && endpointId
        ? api.listWebhookDeliveries(tenantId, endpointId)
        : Promise.resolve({ items: [], total: 0 }),
    enabled: Boolean(tenantId && endpointId),
    refetchInterval: 5000,
  });
}

export function useRedeliverWebhook(tenantId?: string, endpointId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => {
      if (!tenantId) throw new Error("Tenant ID required");
      return api.redeliverWebhook(tenantId, deliveryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.deliveries(tenantId, endpointId) });
      toast.success("Webhook delivery re-enqueued");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to redeliver webhook"));
    },
  });
}
