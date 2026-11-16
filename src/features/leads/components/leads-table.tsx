"use client";

import { useState } from "react";
import {
  DollarSignIcon,
  Edit2Icon,
  LockIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useDeleteLead, useLeads } from "../queries";
import type { Lead, LeadStatus } from "../types";
import { LeadFormDialog } from "./lead-form-dialog";

const STATUS_VARIANTS: Record<
  LeadStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  new: { label: "New", variant: "outline" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "default" },
  proposal: { label: "Proposal", variant: "secondary" },
  won: { label: "Won", variant: "default" },
  lost: { label: "Lost", variant: "destructive" },
};

export function LeadsTable() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({ search: search || undefined });
  const deleteMutation = useDeleteLead();

  const leads = data?.items ?? [];

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormOpen(true);
  };

  const handleDelete = async (lead: Lead) => {
    if (confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
      await deleteMutation.mutateAsync(lead.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search leads by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setSelectedLead(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Create Lead
        </Button>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact / Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Loading CRM leads...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  No leads found. Either none have been created or your assigned workspace PBAC
                  policy restricts access to these records.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const statusMeta = STATUS_VARIANTS[lead.status] ?? {
                  label: lead.status,
                  variant: "outline",
                };
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.name}</span>
                        {lead.isConfidential && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500/30 text-[10px] text-amber-500"
                          >
                            <LockIcon className="h-2.5 w-2.5" />
                            Confidential
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {lead.email} {lead.company ? `• ${lead.company}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center text-sm">
                        <DollarSignIcon className="text-muted-foreground mr-0.5 h-3.5 w-3.5" />
                        {lead.value.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {lead.departmentId || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs uppercase">
                      {lead.regionId || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(lead)} className="gap-2">
                            <Edit2Icon className="h-4 w-4" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(lead)}
                            className="text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2Icon className="h-4 w-4" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={selectedLead} />
    </div>
  );
}
