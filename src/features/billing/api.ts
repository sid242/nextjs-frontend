import { api } from "@/lib/api/http";

import type { Invoice, InvoicesListResponse, ListInvoicesQuery } from "./schemas";

export async function getTenantInvoices(
  query?: ListInvoicesQuery,
  signal?: AbortSignal,
): Promise<InvoicesListResponse> {
  return api.get<InvoicesListResponse>("/billing/invoices", {
    params: query,
    signal,
  });
}

export async function getTenantInvoiceById(id: string, signal?: AbortSignal): Promise<Invoice> {
  return api.get<Invoice>(`/billing/invoices/${id}`, { signal });
}

export async function getPlatformInvoices(
  query?: ListInvoicesQuery & { tenantId?: string },
  signal?: AbortSignal,
): Promise<InvoicesListResponse> {
  return api.get<InvoicesListResponse>("/billing/platform/invoices", {
    params: query,
    signal,
  });
}
