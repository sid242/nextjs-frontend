import type { ListInvoicesQuery, ListPaymentsQuery } from "./schemas";

export const billingKeys = {
  all: ["billing"] as const,
  tenantInvoices: (query?: ListInvoicesQuery) => [...billingKeys.all, "invoices", query] as const,
  tenantInvoiceDetail: (id: string) => [...billingKeys.all, "invoice", id] as const,
  platformInvoices: (query?: ListInvoicesQuery & { tenantId?: string }) =>
    [...billingKeys.all, "platform-invoices", query] as const,
  tenantPayments: (query?: ListPaymentsQuery) => [...billingKeys.all, "payments", query] as const,
  platformPayments: (query?: ListPaymentsQuery) =>
    [...billingKeys.all, "platform-payments", query] as const,
};
