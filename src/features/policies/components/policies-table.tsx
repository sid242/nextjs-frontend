"use client";

import { useState } from "react";
import {
  Edit2Icon,
  Link2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
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

import { useDeletePolicy, usePolicies } from "../queries";
import type { Policy } from "../types";
import { AttachRoleDialog } from "./attach-role-dialog";
import { PolicyFormDialog } from "./policy-form-dialog";

export function PoliciesTable() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const { data, isLoading } = usePolicies({ search: search || undefined });
  const deleteMutation = useDeletePolicy();

  const policies = data?.items ?? [];

  const handleEdit = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormOpen(true);
  };

  const handleAttach = (policy: Policy) => {
    setSelectedPolicy(policy);
    setAttachOpen(true);
  };

  const handleDelete = async (policy: Policy) => {
    if (confirm(`Are you sure you want to delete policy "${policy.name}"?`)) {
      await deleteMutation.mutateAsync(policy.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setSelectedPolicy(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Effect</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Loading access policies...
                </TableCell>
              </TableRow>
            ) : policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  No access policies defined yet. Click &quot;Create Policy&quot; to configure your
                  first rule.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="font-medium">{policy.name}</div>
                    {policy.description && (
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        {policy.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {policy.effect === "allow" ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      >
                        <ShieldCheckIcon className="h-3 w-3" />
                        Allow
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-destructive border-destructive/30 bg-destructive/10 gap-1"
                      >
                        <ShieldAlertIcon className="h-3 w-3" />
                        Deny
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{policy.resource}</TableCell>
                  <TableCell className="font-mono text-xs">{policy.action}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {policy.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.isActive ? "default" : "outline"} className="text-xs">
                      {policy.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAttach(policy)} className="gap-2">
                          <Link2Icon className="h-4 w-4" />
                          Attach to Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(policy)} className="gap-2">
                          <Edit2Icon className="h-4 w-4" />
                          Edit Policy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(policy)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2Icon className="h-4 w-4" />
                          Delete Policy
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PolicyFormDialog open={formOpen} onOpenChange={setFormOpen} policy={selectedPolicy} />

      <AttachRoleDialog open={attachOpen} onOpenChange={setAttachOpen} policy={selectedPolicy} />
    </div>
  );
}
