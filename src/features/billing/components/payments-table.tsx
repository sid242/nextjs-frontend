"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { TablePagination } from "@/components/molecules/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

import { useTenantPayments } from "../queries";
import type { Payment } from "../schemas";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
> = {
  PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
  CAPTURED: { label: "Captured", variant: "default", icon: CheckCircle2 },
  AUTHORIZED: { label: "Authorized", variant: "secondary", icon: Clock },
  CREATED: { label: "Pending", variant: "outline", icon: Clock },
  PENDING: { label: "Pending", variant: "outline", icon: Clock },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle },
  REFUNDED: { label: "Refunded", variant: "secondary", icon: RotateCcw },
  PARTIALLY_REFUNDED: { label: "Partially Refunded", variant: "secondary", icon: RotateCcw },
};

function formatCurrency(minor: number, currency = "INR"): string {
  const isINR = currency?.toUpperCase?.() === "INR";
  const amount = (minor ?? 0) / 100;

  try {
    return new Intl.NumberFormat(isINR ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function PaymentsTable() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useTenantPayments({
    page,
    limit: pageSize,
  });

  const payments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="border-border/80 bg-card/50 rounded-2xl shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Payment History</CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {total} {total === 1 ? "payment" : "payments"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Complete transaction logs, receipt identifiers, and gateway status.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-4 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Unable to load transaction history. Please refresh the page.</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-muted/60 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Receipt className="h-6 w-6 opacity-60" />
            </div>
            <p className="text-foreground text-sm font-medium">No payments on file</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              When your workspace completes plan purchases or subscription renewals, transactions
              will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-border/60 overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Gateway Ref</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-right text-xs">Amount</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: Payment) => {
                    const fallbackStatus = {
                      label: "Pending",
                      variant: "outline" as const,
                      icon: Clock,
                    };
                    const statusCfg = STATUS_CONFIG[payment?.status ?? ""] ?? fallbackStatus;
                    const StatusIcon = statusCfg.icon;

                    return (
                      <TableRow key={payment?.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(payment?.paidAt || payment?.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="text-foreground font-mono text-[11px]">
                            {payment?.providerPaymentId ||
                              payment?.providerOrderId ||
                              payment?.id?.slice(0, 8)}
                          </div>
                          {payment?.providerPaymentId && payment?.providerOrderId ? (
                            <div className="text-muted-foreground font-mono text-[10px]">
                              Order: {payment.providerOrderId}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="text-muted-foreground flex items-center gap-1.5 capitalize">
                            <CreditCard className="text-muted-foreground/70 h-3.5 w-3.5" />
                            {payment?.paymentMethod || "Online (Razorpay)"}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground text-right text-xs font-semibold">
                          {formatCurrency(payment?.amountMinor ?? 0, payment?.currency ?? "INR")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={statusCfg.variant}
                            className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
