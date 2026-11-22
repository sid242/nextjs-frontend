"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSignIcon,
  Edit2Icon,
  LockIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

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
import { TENANT_PERMISSIONS } from "@/config/permissions";
import { TENANT_PATHS } from "@/config/routes";
import { hasTenantPermission, useActiveTenant, useTenantContext } from "@/features/tenants";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { useTenantHref } from "@/lib/tenancy";

import { useDeleteLead, useLeads } from "../queries";
import type { Lead, LeadStatus } from "../types";

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
  const tenantHref = useTenantHref();
  const { activeTenant } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenant?.id ?? null);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useLeads({ search: search || undefined });
  const deleteMutation = useDeleteLead();

  const isForbidden = error instanceof ApiError && error.status === 403;
  const canCreate = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.LEADS_CREATE);
  const canEdit = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.LEADS_UPDATE);
  const canDelete = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.LEADS_DELETE);
  const showActions = canEdit || canDelete;
  const columnCount = showActions ? 6 : 5;

  const leads = data?.items ?? [];

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(lead.id);
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
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
        {canCreate && (
          <Button asChild className="gap-2">
            <Link href={tenantHref(TENANT_PATHS.LEAD_NEW)}>
              <PlusIcon className="h-4 w-4" />
              Create Lead
            </Link>
          </Button>
        )}
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
              {showActions && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-muted-foreground py-8 text-center">
                  Loading CRM leads...
                </TableCell>
              </TableRow>
            ) : isForbidden ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                      <LockIcon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Access Restricted</p>
                      <p className="text-muted-foreground mx-auto max-w-sm text-xs">
                        Your workspace role does not have permission to view CRM leads. Contact an
                        administrator to update your PBAC policy or assign a role with read access.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-muted-foreground py-8 text-center">
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
                    {showActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${lead.name}`}
                            >
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={tenantHref(TENANT_PATHS.LEAD_EDIT(lead.id))}
                                  className="flex cursor-pointer items-center gap-2"
                                >
                                  <Edit2Icon className="h-4 w-4" />
                                  Edit Lead
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canEdit && canDelete && <DropdownMenuSeparator />}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(lead)}
                                className="text-destructive focus:text-destructive cursor-pointer gap-2"
                              >
                                <Trash2Icon className="h-4 w-4" />
                                Delete Lead
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
