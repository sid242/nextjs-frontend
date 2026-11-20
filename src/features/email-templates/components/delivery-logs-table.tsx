"use client";

import { useState } from "react";
import { EyeIcon, RefreshCwIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { useDebouncedCallback } from "@/lib/hooks";

import { useEmailDeliveryLogs } from "../queries";
import type { EmailDeliveryStatus, EmailMessageRecord } from "../types";

const STATUS_BADGES: Record<
  EmailDeliveryStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  QUEUED: { label: "Queued", variant: "outline" },
  SENT: { label: "Sent", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "default" },
  BOUNCED: { label: "Bounced", variant: "destructive" },
  COMPLAINED: { label: "Complaint", variant: "destructive" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function DeliveryLogsTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageRecord | null>(null);

  const syncSearch = useDebouncedCallback((val: string) => {
    setDebouncedSearch(val);
    setPage(1);
  }, 250);

  const { data, isLoading, refetch, isRefetching } = useEmailDeliveryLogs({
    page,
    limit,
    status: statusFilter === "ALL" ? undefined : (statusFilter as EmailDeliveryStatus),
    to: debouncedSearch || undefined,
  });

  const messages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              syncSearch.run(e.target.value);
            }}
            placeholder="Search recipient email..."
            className="h-9 pl-9"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="BOUNCED">Bounced</SelectItem>
              <SelectItem value="COMPLAINED">Complaint</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-3"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCwIcon className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-xl border shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Spinner className="text-muted-foreground mx-auto size-6" />
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                  No email delivery messages found.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => {
                const badge = STATUS_BADGES[msg.status] || {
                  label: msg.status,
                  variant: "outline",
                };
                return (
                  <TableRow key={msg.id} className="hover:bg-muted/40">
                    <TableCell className="text-sm font-medium">{msg.to}</TableCell>
                    <TableCell className="line-clamp-1 max-w-[260px] text-sm">
                      {msg.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {msg.provider || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{msg.attempts}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <EyeIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {total > limit && (
          <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-3 text-xs">
            <span>
              Showing {messages.length} of {total} messages
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(o) => !o && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>Delivery Message Details</DialogTitle>
            <DialogDescription>Unique ID: {selectedMessage?.id}</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b py-1">
                <span className="text-muted-foreground font-medium">To:</span>
                <span className="col-span-2 font-mono text-xs">{selectedMessage.to}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b py-1">
                <span className="text-muted-foreground font-medium">Subject:</span>
                <span className="col-span-2">{selectedMessage.subject}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b py-1">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="col-span-2">
                  <Badge variant={STATUS_BADGES[selectedMessage.status]?.variant || "outline"}>
                    {selectedMessage.status}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b py-1">
                <span className="text-muted-foreground font-medium">Provider ID:</span>
                <span className="col-span-2 font-mono text-xs break-all">
                  {selectedMessage.providerMessageId || "—"}
                </span>
              </div>
              {selectedMessage.lastError && (
                <div className="bg-destructive/10 grid grid-cols-3 gap-2 rounded-md border-b p-2 py-1">
                  <span className="text-destructive font-semibold">Error:</span>
                  <span className="text-destructive col-span-2 font-mono text-xs">
                    {selectedMessage.lastError}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 border-b py-1">
                <span className="text-muted-foreground font-medium">Created:</span>
                <span className="col-span-2 text-xs">{formatDate(selectedMessage.createdAt)}</span>
              </div>
              {selectedMessage.sentAt && (
                <div className="grid grid-cols-3 gap-2 py-1">
                  <span className="text-muted-foreground font-medium">Sent At:</span>
                  <span className="col-span-2 text-xs">{formatDate(selectedMessage.sentAt)}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
