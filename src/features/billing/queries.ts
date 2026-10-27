import { queryOptions, useQuery } from "@tanstack/react-query";

import { getPlatformInvoices, getTenantInvoiceById, getTenantInvoices } from "./api";
import { billingKeys } from "./keys";
import type { ListInvoicesQuery } from "./schemas";

export const tenantInvoicesQueryOptions = (query?: ListInvoicesQuery) =>
  queryOptions({
    queryKey: billingKeys.tenantInvoices(query),
    queryFn: ({ signal }) => getTenantInvoices(query, signal),
  });

export function useTenantInvoices(query?: ListInvoicesQuery) {
  return useQuery(tenantInvoicesQueryOptions(query));
}

export const tenantInvoiceDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: billingKeys.tenantInvoiceDetail(id),
    queryFn: ({ signal }) => getTenantInvoiceById(id, signal),
    enabled: Boolean(id),
  });

export function useTenantInvoiceDetail(id: string) {
  return useQuery(tenantInvoiceDetailQueryOptions(id));
}

export const platformInvoicesQueryOptions = (query?: ListInvoicesQuery & { tenantId?: string }) =>
  queryOptions({
    queryKey: billingKeys.platformInvoices(query),
    queryFn: ({ signal }) => getPlatformInvoices(query, signal),
  });

export function usePlatformInvoices(query?: ListInvoicesQuery & { tenantId?: string }) {
  return useQuery(platformInvoicesQueryOptions(query));
}
