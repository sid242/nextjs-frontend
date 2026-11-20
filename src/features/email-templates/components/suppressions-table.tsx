"use client";

import { useState } from "react";
import { PlusIcon, RefreshCwIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { useCreateSuppression, useDeleteSuppression, useEmailSuppressions } from "../queries";
import type { EmailSuppressionReason } from "../types";

export function SuppressionsTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for manual suppression
  const [addEmail, setAddEmail] = useState("");
  const [addReason, setAddReason] = useState<EmailSuppressionReason>("MANUAL");
  const [addDetails, setAddDetails] = useState("");

  const syncSearch = useDebouncedCallback((val: string) => {
    setDebouncedSearch(val);
    setPage(1);
  }, 250);

  const { data, isLoading, refetch, isRefetching } = useEmailSuppressions({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const createMutation = useCreateSuppression({
    onSuccess: () => {
      setIsAddModalOpen(false);
      setAddEmail("");
      setAddDetails("");
    },
  });

  const deleteMutation = useDeleteSuppression();

  const suppressions = data?.suppressions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleAddSuppression = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    createMutation.mutate({
      email: addEmail.trim(),
      reason: addReason,
      details: addDetails.trim() || undefined,
    });
  };

  const handleDelete = (id: string, email: string) => {
    if (
      confirm(
        `Are you sure you want to remove ${email} from the suppression list? Future emails will be delivered normally.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header / Actions Bar */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              syncSearch.run(e.target.value);
            }}
            placeholder="Search suppressed emails..."
            className="h-9 pl-9"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
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

          <Button size="sm" className="h-9 gap-1.5 px-3" onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon className="size-4" />
            <span>Add Suppression</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-xl border shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email Address</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Details / Diagnostics</TableHead>
              <TableHead>Suppressed On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Spinner className="text-muted-foreground mx-auto size-6" />
                </TableCell>
              </TableRow>
            ) : suppressions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                  No suppressed addresses found.
                </TableCell>
              </TableRow>
            ) : (
              suppressions.map((sup) => (
                <TableRow key={sup.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-sm font-medium">{sup.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sup.reason === "BOUNCE" || sup.reason === "COMPLAINT"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {sup.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[280px] truncate text-xs">
                    {sup.details || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(sup.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-7"
                      onClick={() => handleDelete(sup.id, sup.email)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {total > limit && (
          <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-3 text-xs">
            <span>
              Showing {suppressions.length} of {total} suppressed emails
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

      {/* Add Suppression Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleAddSuppression} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Email to Suppression List</DialogTitle>
              <DialogDescription>
                Suppressed emails will be automatically skipped by background workers to protect
                sender reputation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sup-email">Recipient Email</Label>
                <Input
                  id="sup-email"
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-reason">Suppression Reason</Label>
                <Select
                  value={addReason}
                  onValueChange={(val: EmailSuppressionReason) => setAddReason(val)}
                >
                  <SelectTrigger id="sup-reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual Suppression</SelectItem>
                    <SelectItem value="BOUNCE">Hard Bounce</SelectItem>
                    <SelectItem value="COMPLAINT">Spam Complaint</SelectItem>
                    <SelectItem value="UNSUBSCRIBE">Unsubscribe Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-details">Details / Notes</Label>
                <Input
                  id="sup-details"
                  value={addDetails}
                  onChange={(e) => setAddDetails(e.target.value)}
                  placeholder="Optional context or SMTP response code"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add to Suppressions"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
