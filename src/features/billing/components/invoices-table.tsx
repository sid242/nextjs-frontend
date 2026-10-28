"use client";

import { useId, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Receipt,
  XCircle,
} from "lucide-react";

import { TablePagination } from "@/components/molecules/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { useSearchQueryParams } from "@/lib/hooks";

import { useTenantInvoices } from "../queries";
import type { Invoice, InvoiceStatus } from "../schemas";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
> = {
  PAID: { label: "Paid", variant: "default", icon: CheckCircle2 },
  OPEN: { label: "Payment Due", variant: "secondary", icon: Clock },
  DRAFT: { label: "Draft", variant: "outline", icon: FileText },
  VOID: { label: "Void", variant: "destructive", icon: XCircle },
  UNCOLLECTABLE: { label: "Uncollectable", variant: "destructive", icon: XCircle },
};

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function InvoicesTable() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>("ALL");
  const dialogTitleId = useId();

  const { getNumber, setParam, setParams } = useSearchQueryParams();
  const rawPage = getNumber("page", 1) ?? 1;
  const page = Math.max(1, rawPage);
  const rawLimit = getNumber("limit", 10) ?? 10;
  const pageSize = [10, 20, 50].includes(rawLimit) ? rawLimit : 10;

  const queryParams = useMemo(() => {
    return {
      page,
      limit: pageSize,
      ...(activeStatusTab !== "ALL" ? { status: activeStatusTab as InvoiceStatus } : {}),
    };
  }, [page, pageSize, activeStatusTab]);

  const { data, isLoading, isError, error } = useTenantInvoices(queryParams);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Card className="border-border/80 rounded-2xl shadow-xs">
        <CardHeader className="gap-y-3 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <Receipt className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight">
                  Billing Invoices &amp; History
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  View past statements, itemized receipts, and tax invoices for this workspace.
                </CardDescription>
              </div>
            </div>

            {/* Status Filter Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
              <Filter className="text-muted-foreground mr-1 size-3.5" />
              {(["ALL", "PAID", "OPEN", "DRAFT"] as const).map((tab) => {
                const isSelected = activeStatusTab === tab;
                return (
                  <Button
                    key={tab}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-lg px-2.5 text-xs font-medium"
                    onClick={() => {
                      setActiveStatusTab(tab);
                      setParam("page", 1);
                    }}
                  >
                    {tab === "ALL" ? "All Invoices" : (STATUS_CONFIG[tab]?.label ?? tab)}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-destructive p-8 text-center text-sm">
              Failed to load invoices: {getErrorMessage(error)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="bg-muted text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-foreground text-sm font-medium">No invoices generated yet</p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                When subscription renewal periods start or plan changes occur, finalized invoices
                and receipts will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border border-b hover:bg-transparent">
                    <TableHead className="w-44 text-xs font-medium">Invoice Number</TableHead>
                    <TableHead className="text-xs font-medium">Billing Period</TableHead>
                    <TableHead className="text-xs font-medium">Amount</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
                    <TableHead className="text-xs font-medium">Due / Paid Date</TableHead>
                    <TableHead className="w-24 text-right text-xs font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((inv) => {
                    const statusMeta = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                    const StatusIcon = statusMeta.icon;

                    return (
                      <TableRow
                        key={inv.id}
                        className="border-border/50 hover:bg-muted/40 border-b"
                      >
                        <TableCell className="text-foreground font-mono text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <FileText className="text-muted-foreground h-3.5 w-3.5" />
                            {inv.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="text-muted-foreground/70 h-3.5 w-3.5" />
                            <span>
                              {inv.billingPeriodStart
                                ? formatDate(inv.billingPeriodStart)
                                : formatDate(inv.createdAt)}
                              {inv.billingPeriodEnd ? ` – ${formatDate(inv.billingPeriodEnd)}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground text-xs font-semibold">
                          {formatCurrency(inv.totalCents, inv.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusMeta.variant}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {inv.status === "PAID" ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              Paid {formatDate(inv.paidAt)}
                            </span>
                          ) : inv.dueDate ? (
                            <span>Due {formatDate(inv.dueDate)}</span>
                          ) : (
                            formatDate(inv.createdAt)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                              title="View Invoice Details"
                              onClick={() => setSelectedInvoice(inv)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="sr-only">View</span>
                            </Button>
                            {inv.pdfUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                                title="Download PDF"
                                asChild
                              >
                                <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3.5 w-3.5" />
                                  <span className="sr-only">Download</span>
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {total > 0 ? (
            <div className="border-border border-t px-4 py-3">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={total}
                onPageChange={(newPage) => setParam("page", newPage)}
                onPageSizeChange={(newSize) => setParams({ limit: newSize, page: 1 })}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Itemized Line Items Detail Dialog */}
      <Dialog
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="border-border/80 max-w-lg rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle id={dialogTitleId} className="flex items-center gap-2">
              <Receipt className="text-primary size-5" />
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Statement issued on {formatDate(selectedInvoice?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice ? (
            <div className="space-y-4 pt-2">
              <div className="border-border/70 bg-muted/30 grid grid-cols-2 gap-3 rounded-xl border p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="text-foreground mt-1 font-semibold">
                    {STATUS_CONFIG[selectedInvoice.status]?.label ?? selectedInvoice.status}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Currency</span>
                  <div className="text-foreground mt-1 font-semibold uppercase">
                    {selectedInvoice.currency}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="border-border overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Item Description</TableHead>
                      <TableHead className="w-16 text-center text-xs">Qty</TableHead>
                      <TableHead className="w-24 text-right text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedInvoice.lineItems ?? []).length > 0 ? (
                      selectedInvoice.lineItems?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-foreground text-xs font-medium">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center text-xs">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-foreground text-right text-xs font-semibold">
                            {formatCurrency(item.totalCents, selectedInvoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-foreground text-xs font-medium">
                          {selectedInvoice.planName
                            ? `${selectedInvoice.planName} Plan Subscription`
                            : "Workspace Subscription"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-center text-xs">
                          1
                        </TableCell>
                        <TableCell className="text-foreground text-right text-xs font-semibold">
                          {formatCurrency(selectedInvoice.amountCents, selectedInvoice.currency)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Breakdown summary */}
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="text-muted-foreground flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(selectedInvoice.amountCents, selectedInvoice.currency)}
                  </span>
                </div>
                {selectedInvoice.taxCents > 0 ? (
                  <div className="text-muted-foreground flex justify-between">
                    <span>Tax</span>
                    <span>
                      {formatCurrency(selectedInvoice.taxCents, selectedInvoice.currency)}
                    </span>
                  </div>
                ) : null}
                <div className="text-foreground border-border flex justify-between border-t pt-1 text-sm font-semibold">
                  <span>Total Amount</span>
                  <span>
                    {formatCurrency(selectedInvoice.totalCents, selectedInvoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
