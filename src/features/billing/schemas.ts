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

// ==========================================
// Razorpay Payments & Checkout
// ==========================================

export const paymentStatusSchema = z.enum([
  "CREATED",
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  subscriptionId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  providerOrderId: z.string().nullable().optional(),
  providerPaymentId: z.string().nullable().optional(),
  amountMinor: z.number().int(),
  currency: z.string(),
  status: z.string(),
  paymentMethod: z.string().nullable().optional(),
  failureCode: z.string().nullable().optional(),
  failureDescription: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  tenantName: z.string().optional(),
  tenantSlug: z.string().optional(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const paymentsListResponseSchema = z.object({
  items: z.array(paymentSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type PaymentsListResponse = z.infer<typeof paymentsListResponseSchema>;

export const listPaymentsQuerySchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

export const checkoutOrderInputSchema = z.object({
  planKey: z.string().trim().min(1).toUpperCase(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
});
export type CheckoutOrderInput = z.infer<typeof checkoutOrderInputSchema>;

export const checkoutOrderResponseSchema = z.object({
  keyId: z.string(),
  orderId: z.string(),
  amountMinor: z.number(),
  currency: z.string(),
  planName: z.string(),
  paymentRecordId: z.string(),
});
export type CheckoutOrderResponse = z.infer<typeof checkoutOrderResponseSchema>;

export const verifyOrderPaymentInputSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});
export type VerifyOrderPaymentInput = z.infer<typeof verifyOrderPaymentInputSchema>;

export const checkoutSubscriptionInputSchema = z.object({
  planKey: z.string().trim().min(1).toUpperCase(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  totalCount: z.number().int().min(1).default(12),
});
export type CheckoutSubscriptionInput = z.infer<typeof checkoutSubscriptionInputSchema>;

export const verifySubscriptionPaymentInputSchema = z.object({
  razorpay_subscription_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});
export type VerifySubscriptionPaymentInput = z.infer<typeof verifySubscriptionPaymentInputSchema>;

export const cancelSubscriptionInputSchema = z.object({
  immediately: z.boolean().default(false),
  reason: z.string().trim().max(500).optional(),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionInputSchema>;

export const issueRefundInputSchema = z.object({
  amountMinor: z.number().int().min(1).optional(),
  reason: z.string().trim().min(3).max(500),
});
export type IssueRefundInput = z.infer<typeof issueRefundInputSchema>;
