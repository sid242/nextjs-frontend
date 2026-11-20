"use client";

import { useState } from "react";
import Link from "next/link";
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
import { PLATFORM_ROUTES } from "@/config/routes";
import type { Policy } from "@/features/policies";

import { useDeletePlatformPolicy, usePlatformPolicies } from "../queries";
import { AttachPlatformRoleDialog } from "./attach-platform-role-dialog";

export function PlatformPoliciesTable() {
  const [search, setSearch] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const { data, isLoading } = usePlatformPolicies({ search: search || undefined });
  const deleteMutation = useDeletePlatformPolicy();

  const policies = data?.items ?? [];

  const handleAttach = (policy: Policy) => {
    setSelectedPolicy(policy);
    setAttachOpen(true);
  };

  const handleDelete = async (policy: Policy) => {
    if (confirm(`Are you sure you want to delete platform policy "${policy.name}"?`)) {
      await deleteMutation.mutateAsync(policy.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search platform policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          asChild
          className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
        >
          <Link href={PLATFORM_ROUTES.POLICY_NEW}>
            <PlusIcon className="h-4 w-4" />
            Create Platform Policy
          </Link>
        </Button>
      </div>

      <div className="bg-card border-border/80 overflow-hidden rounded-xl border shadow-xs">
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
                <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                  Loading platform access policies...
                </TableCell>
              </TableRow>
            ) : policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                  No platform access policies defined yet. Click &quot;Create Platform Policy&quot;
                  to author fine-grained operator rules.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <span className="text-sm font-semibold">{policy.name}</span>
                      {policy.description && (
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {policy.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={policy.effect === "allow" ? "default" : "destructive"}
                      className="gap-1 font-mono text-xs uppercase"
                    >
                      {policy.effect === "allow" ? (
                        <ShieldCheckIcon className="h-3 w-3" />
                      ) : (
                        <ShieldAlertIcon className="h-3 w-3" />
                      )}
                      {policy.effect}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {policy.resource}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {policy.action}
                  </TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleAttach(policy)}
                          className="cursor-pointer gap-2"
                        >
                          <Link2Icon className="h-4 w-4" />
                          Attach to Platform Role
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/platform/policies/${policy.id}/edit`}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Edit2Icon className="h-4 w-4" />
                            Edit Policy
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(policy)}
                          className="text-destructive focus:text-destructive cursor-pointer gap-2"
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

      <AttachPlatformRoleDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        policy={selectedPolicy}
      />
    </div>
  );
}
