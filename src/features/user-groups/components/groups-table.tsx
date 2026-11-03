"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Edit, Eye, Loader2, MoreVertical, Plus, Search, Users } from "lucide-react";

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

import type { GroupFilters, UserGroup } from "../types";
import { GroupStatusBadge } from "./group-status-badge";

interface GroupsTableProps {
  groups: UserGroup[];
  total: number;
  isLoading: boolean;
  filters: GroupFilters;
  onFiltersChange: (filters: GroupFilters) => void;
  createHref?: string;
  detailHref?: (group: UserGroup) => string;
  onCreateClick?: () => void;
  onEditClick?: (group: UserGroup) => void;
  onArchiveClick?: (group: UserGroup) => void;
  onManageMembersClick?: (group: UserGroup) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  canManageMembers?: boolean;
}

export function GroupsTable({
  groups,
  total,
  isLoading,
  filters,
  onFiltersChange,
  createHref,
  detailHref,
  onCreateClick,
  onEditClick,
  onArchiveClick,
  onManageMembersClick,
  canCreate = true,
  canEdit = true,
  canArchive = true,
  canManageMembers = true,
}: GroupsTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      search: searchInput.trim() || undefined,
      page: 1,
    });
  };

  const handleStatusChange = (status: "ACTIVE" | "ARCHIVED" | "ALL") => {
    onFiltersChange({
      ...filters,
      status,
      page: 1,
    });
  };

  const totalPages = Math.ceil(total / (filters.limit ?? 20)) || 1;
  const currentPage = filters.page ?? 1;

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search groups by name or slug..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </form>

          {/* Status Segmented Tabs */}
          <div className="bg-muted/60 flex items-center rounded-xl border p-1 text-xs">
            {(["ACTIVE", "ARCHIVED", "ALL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  (filters.status ?? "ACTIVE") === s
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Archived"}
              </button>
            ))}
          </div>
        </div>

        {canCreate &&
          (createHref ? (
            <Button asChild className="h-10 shrink-0 rounded-xl shadow-xs">
              <Link href={createHref}>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Link>
            </Button>
          ) : onCreateClick ? (
            <Button onClick={onCreateClick} className="h-10 shrink-0 rounded-xl shadow-xs">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          ) : null)}
      </div>

      {/* Main Table */}
      <div className="bg-card/40 overflow-hidden rounded-2xl border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-60">Group Name</TableHead>
              <TableHead className="w-44">Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28 text-center">Members</TableHead>
              <TableHead className="w-36">Created</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground mt-2 text-sm">Loading user groups...</p>
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Users className="text-muted-foreground/60 mx-auto h-8 w-8" />
                  <h3 className="mt-2 text-base font-semibold">No user groups found</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {filters.search
                      ? "No groups matched your search criteria."
                      : "Create your first user group to organize members."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                const isArchived = group.status === "ARCHIVED";

                return (
                  <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-600 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-400">
                          {group.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          {detailHref ? (
                            <Link
                              href={detailHref(group)}
                              className="text-foreground hover:text-primary text-sm font-semibold transition-colors hover:underline"
                            >
                              {group.name}
                            </Link>
                          ) : (
                            <div className="text-sm font-medium">{group.name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {group.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                      {group.description || "—"}
                    </TableCell>
                    <TableCell>
                      <GroupStatusBadge status={group.status} />
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <button
                        type="button"
                        onClick={() => onManageMembersClick?.(group)}
                        className="bg-muted hover:bg-muted/80 text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                        title="Click to view/manage group members"
                      >
                        <Users className="text-muted-foreground h-3 w-3" />
                        {group.memberCount ?? 0}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {detailHref && (
                            <DropdownMenuItem asChild>
                              <Link href={detailHref(group)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => onManageMembersClick?.(group)}>
                            <Users className="mr-2 h-4 w-4" />
                            {canManageMembers ? "Manage Members" : "View Members"}
                          </DropdownMenuItem>

                          {canEdit && !isArchived && onEditClick && (
                            <DropdownMenuItem onClick={() => onEditClick(group)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Group
                            </DropdownMenuItem>
                          )}

                          {canArchive && !isArchived && onArchiveClick && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onArchiveClick(group)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive Group
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="bg-muted/20 text-muted-foreground flex items-center justify-between border-t p-3 text-xs">
            <div>
              Showing {groups.length} of {total} groups
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onFiltersChange({ ...filters, page: currentPage - 1 })}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Previous
              </Button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => onFiltersChange({ ...filters, page: currentPage + 1 })}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
