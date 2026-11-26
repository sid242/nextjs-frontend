"use client";

import { useQuery } from "@tanstack/react-query";
import { BanknoteIcon, BarChart3Icon, GlobeIcon, MessageSquareIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { whatsAppUsageMessagesQueryOptions, whatsAppUsageSummaryQueryOptions } from "../queries";

export function WhatsAppUsageTab() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery(
    whatsAppUsageSummaryQueryOptions(),
  );
  const { data: usageRecords = [], isLoading: isLoadingRecords } = useQuery(
    whatsAppUsageMessagesQueryOptions(50),
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Messages Processed
            </CardTitle>
            <MessageSquareIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "..." : (summary?.totalMessages ?? 0).toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              All inbound, outbound, and campaign messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Estimated Total Cost
            </CardTitle>
            <BanknoteIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {isLoadingSummary ? "..." : `₹${summary?.totalEstimatedCost || "0.00"}`}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Estimated based on Meta Cloud API conversation rate cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Template Categories Breakdown
            </CardTitle>
            <BarChart3Icon className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : !summary?.categoryBreakdown?.length ? (
              <div className="text-muted-foreground text-sm">No usage recorded yet</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {summary.categoryBreakdown.map((item) => (
                  <Badge key={item.category} variant="secondary" className="text-xs">
                    {item.category}: {item.count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery &amp; Billing Audit Records</CardTitle>
          <CardDescription>
            Audit log of billed WhatsApp conversations, country of recipient, category, and rate
            card estimation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              Loading usage history...
            </div>
          ) : usageRecords.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              No usage records found. As templates and messages are dispatched, billing entries will
              appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient Country</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Delivery Status</TableHead>
                  <TableHead>Estimated Cost</TableHead>
                  <TableHead>Rate Card</TableHead>
                  <TableHead>Provider Msg ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        <GlobeIcon className="text-muted-foreground h-3.5 w-3.5" />
                        <span>{rec.recipientCountry || "Global"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {rec.templateCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {rec.deliveryStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      ₹{rec.estimatedCost} {rec.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {rec.pricingRateCardVersion}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {rec.providerMessageId ? rec.providerMessageId.slice(0, 16) + "..." : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(rec.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
