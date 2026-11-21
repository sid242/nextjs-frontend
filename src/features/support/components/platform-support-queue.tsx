"use client";

import { useState } from "react";
import { LifeBuoy, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/format";

import { usePlatformFeedback, usePlatformTickets } from "../queries";

export function PlatformSupportQueue() {
  const [ticketStatus, setTicketStatus] = useState<string>("");
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = usePlatformTickets(ticketStatus || undefined);

  const { data: feedback = [], isLoading: isFeedbackLoading } = usePlatformFeedback(20);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <LifeBuoy className="text-primary size-4" /> Incoming Customer Support Tickets
            </CardTitle>
            <CardDescription className="text-xs">
              Review, triage, and resolve issues reported by customer organization members.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {["", "OPEN", "PENDING", "RESOLVED"].map((st) => (
                <Button
                  key={st}
                  variant={ticketStatus === st ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTicketStatus(st)}
                  className="h-7 px-2 text-xs"
                >
                  {st || "All"}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTickets()}
              className="h-7 text-xs"
            >
              <RefreshCw className="mr-1 size-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isTicketsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              No tickets found matching the selected filter.
            </p>
          ) : (
            <div className="border-border/60 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Reference</TableHead>
                    <TableHead className="text-xs font-semibold">Subject</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold">Priority</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-foreground font-mono text-xs font-medium">
                        {t.ticketRef}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs font-medium">
                        {t.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.priority === "URGENT" || t.priority === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                          className="font-mono text-[10px]"
                        >
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === "OPEN"
                              ? "default"
                              : t.status === "RESOLVED"
                                ? "secondary"
                                : "outline"
                          }
                          className="font-mono text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateTime(t.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Feedback Submissions */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent In-App User Feedback</CardTitle>
          <CardDescription className="text-xs">
            Direct ratings and suggestions received from end-users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFeedbackLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No feedback recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="border-border/50 bg-muted/20 flex items-start justify-between gap-3 rounded-lg border p-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">Rating: {item.rating}/5</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-foreground">{item.comment}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
