"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelTenantSubscription,
  createCheckoutOrder,
  getPlatformInvoices,
  getPlatformPayments,
  getTenantInvoiceById,
  getTenantInvoices,
  getTenantPayments,
  issuePlatformRefund,
  verifyOrderPayment,
} from "./api";
import { billingKeys } from "./keys";
import type {
  CancelSubscriptionInput,
  CheckoutOrderInput,
  IssueRefundInput,
  ListInvoicesQuery,
  ListPaymentsQuery,
  VerifyOrderPaymentInput,
} from "./schemas";

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

// ==========================================
// Razorpay Payments Hooks
// ==========================================

export const tenantPaymentsQueryOptions = (query?: ListPaymentsQuery) =>
  queryOptions({
    queryKey: billingKeys.tenantPayments(query),
    queryFn: ({ signal }) => getTenantPayments(query, signal),
  });

export function useTenantPayments(query?: ListPaymentsQuery) {
  return useQuery(tenantPaymentsQueryOptions(query));
}

export function useCreateCheckoutOrder() {
  return useMutation({
    mutationFn: (input: CheckoutOrderInput) => createCheckoutOrder(input),
  });
}

export function useVerifyOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyOrderPaymentInput) => verifyOrderPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useCancelTenantSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelSubscriptionInput) => cancelTenantSubscription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export const platformPaymentsQueryOptions = (query?: ListPaymentsQuery) =>
  queryOptions({
    queryKey: billingKeys.platformPayments(query),
    queryFn: ({ signal }) => getPlatformPayments(query, signal),
  });

export function usePlatformPayments(query?: ListPaymentsQuery) {
  return useQuery(platformPaymentsQueryOptions(query));
}

export function useIssuePlatformRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: IssueRefundInput }) =>
      issuePlatformRefund(paymentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
