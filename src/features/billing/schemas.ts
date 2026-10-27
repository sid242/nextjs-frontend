import { z } from "zod";

export const invoiceStatusSchema = z.enum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTABLE"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unitPriceCents: z.number(),
  totalCents: z.number(),
});
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  subscriptionId: z.string().uuid().nullable().optional(),
  planId: z.string().uuid().nullable().optional(),
  invoiceNumber: z.string(),
  status: invoiceStatusSchema,
  amountCents: z.number().int(),
  taxCents: z.number().int(),
  totalCents: z.number().int(),
  currency: z.string(),
  lineItems: z.array(invoiceLineItemSchema).nullable().optional(),
  billingPeriodStart: z.string().nullable().optional(),
  billingPeriodEnd: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  providerInvoiceId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  tenantName: z.string().optional(),
  planName: z.string().nullable().optional(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const invoicesListResponseSchema = z.object({
  items: z.array(invoiceSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type InvoicesListResponse = z.infer<typeof invoicesListResponseSchema>;

export const listInvoicesQuerySchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  status: invoiceStatusSchema.optional(),
});
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
