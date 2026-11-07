import { api } from "@/lib/api/http";

import type {
  CancelSubscriptionInput,
  CheckoutOrderInput,
  CheckoutOrderResponse,
  CheckoutSubscriptionInput,
  Invoice,
  InvoicesListResponse,
  IssueRefundInput,
  ListInvoicesQuery,
  ListPaymentsQuery,
  PaymentsListResponse,
  VerifyOrderPaymentInput,
  VerifySubscriptionPaymentInput,
} from "./schemas";

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

// ==========================================
// Razorpay Checkout, Subscriptions & Payments
// ==========================================

export async function createCheckoutOrder(
  input: CheckoutOrderInput,
): Promise<CheckoutOrderResponse> {
  return api.post<CheckoutOrderResponse>("/billing/checkout/order", input);
}

export async function verifyOrderPayment(
  input: VerifyOrderPaymentInput,
): Promise<{ success: boolean; status: string; planKey?: string; planName?: string }> {
  return api.post("/billing/checkout/verify", input);
}

export async function createSubscriptionCheckout(input: CheckoutSubscriptionInput): Promise<{
  keyId: string;
  subscriptionId: string;
  planName: string;
  amountMinor: number;
  currency: string;
}> {
  return api.post("/billing/subscriptions", input);
}

export async function verifySubscriptionPayment(
  input: VerifySubscriptionPaymentInput,
): Promise<{ success: boolean; status: string }> {
  return api.post("/billing/subscriptions/verify", input);
}

export async function cancelTenantSubscription(
  input: CancelSubscriptionInput,
): Promise<{ success: boolean; immediately: boolean; cancelAtPeriodEnd: boolean }> {
  return api.post("/billing/subscriptions/cancel", input);
}

export async function getTenantPayments(
  query?: ListPaymentsQuery,
  signal?: AbortSignal,
): Promise<PaymentsListResponse> {
  return api.get<PaymentsListResponse>("/billing/payments", {
    params: query,
    signal,
  });
}

export async function getPlatformPayments(
  query?: ListPaymentsQuery,
  signal?: AbortSignal,
): Promise<PaymentsListResponse> {
  return api.get<PaymentsListResponse>("/billing/platform/payments", {
    params: query,
    signal,
  });
}

export async function issuePlatformRefund(
  paymentId: string,
  input: IssueRefundInput,
): Promise<unknown> {
  return api.post(`/billing/platform/payments/${paymentId}/refund`, input);
}
