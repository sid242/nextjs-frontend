import type { ListInvoicesQuery } from "./schemas";

export const billingKeys = {
  all: ["billing"] as const,
  tenantInvoices: (query?: ListInvoicesQuery) => [...billingKeys.all, "invoices", query] as const,
  tenantInvoiceDetail: (id: string) => [...billingKeys.all, "invoice", id] as const,
  platformInvoices: (query?: ListInvoicesQuery & { tenantId?: string }) =>
    [...billingKeys.all, "platform-invoices", query] as const,
};
