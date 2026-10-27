"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  MailIcon,
  MoreVerticalIcon,
  RefreshCw,
  SearchIcon,
  ShieldAlert,
  Trash2Icon,
  UserCheck,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/format";

import { MEMBER_ROLE_OPTIONS } from "../constants";
import type { TenantMember } from "../schemas";

type MemberStatusFilter = "ALL" | "ACTIVE" | "INVITED" | "SUSPENDED";

interface TeamMembersListProps {
  members: TenantMember[];
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
  onTransferOwnership?: (memberId: string, memberName: string) => void;
  onResendInvite?: (email: string, role: string) => void;
  isCurrentUserOwner?: boolean;
  canManageRoles?: boolean;
  canRemoveMembers?: boolean;
}

export function TeamMembersList({
  members = [],
  isLoading = false,
  searchQuery,
  onSearchChange,
  onRoleChange,
  onRemoveMember,
  onTransferOwnership,
  onResendInvite,
  isCurrentUserOwner = false,
  canManageRoles = true,
  canRemoveMembers = true,
}: TeamMembersListProps) {
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("ALL");

  const counts = useMemo(() => {
    return {
      all: members?.length ?? 0,
      active: (members ?? []).filter((m) => m?.status === "ACTIVE").length,
      invited: (members ?? []).filter((m) => m?.status === "INVITED").length,
      suspended: (members ?? []).filter((m) => m?.status === "SUSPENDED").length,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return (members ?? []).filter((m: TenantMember) => {
      const matchesSearch =
        m?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter !== "ALL" && m?.status !== statusFilter) return false;
      return true;
    });
  }, [members, searchQuery, statusFilter]);

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Organization Members</CardTitle>
            <CardDescription className="text-xs">
              Users who have access to workspace data and shared resources.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e?.target?.value ?? "")}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="border-border/40 flex flex-wrap items-center gap-1.5 border-t pt-3">
          <Button
            type="button"
            variant={statusFilter === "ALL" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium"
            onClick={() => setStatusFilter("ALL")}
          >
            <Users className="size-3.5" /> All Members
            <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px]">
              {counts.all}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={statusFilter === "ACTIVE" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium"
            onClick={() => setStatusFilter("ACTIVE")}
          >
            <UserCheck className="size-3.5 text-emerald-500" /> Active
            <Badge
              variant="outline"
              className="ml-0.5 border-emerald-500/30 px-1 py-0 text-[10px] text-emerald-500"
            >
              {counts.active}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={statusFilter === "INVITED" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium"
            onClick={() => setStatusFilter("INVITED")}
          >
            <Clock className="size-3.5 text-amber-500" /> Pending Invites
            <Badge
              variant="outline"
              className="ml-0.5 border-amber-500/30 px-1 py-0 text-[10px] text-amber-500"
            >
              {counts.invited}
            </Badge>
          </Button>

          {counts.suspended > 0 ? (
            <Button
              type="button"
              variant={statusFilter === "SUSPENDED" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs font-medium"
              onClick={() => setStatusFilter("SUSPENDED")}
            >
              Suspended
              <Badge variant="outline" className="ml-0.5 px-1 py-0 text-[10px]">
                {counts.suspended}
              </Badge>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground animate-pulse text-sm">Loading members…</div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              {statusFilter === "INVITED"
                ? "No pending invitations"
                : statusFilter === "ACTIVE"
                  ? "No active members found"
                  : "No members found"}
            </p>
            <p className="text-muted-foreground/70 mt-1 text-xs">
              {statusFilter === "INVITED"
                ? "All invited teammates have accepted their invitations."
                : "Try refining your search query or invite a new collaborator."}
            </p>
          </div>
        ) : (
          <div className="divide-border/50 divide-y">
            {filteredMembers.map((member: TenantMember) => (
              <div
                key={member.id}
                className="hover:bg-accent/30 flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(member?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-semibold">{member?.name}</span>
                      {member?.status === "INVITED" ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
                        >
                          Pending Acceptance
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <MailIcon className="size-3" />
                      {member?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge
                    variant={
                      member?.status === "ACTIVE"
                        ? "outline"
                        : member?.status === "INVITED"
                          ? "secondary"
                          : "default"
                    }
                    className="text-[11px] tracking-wider uppercase"
                  >
                    {member?.status}
                  </Badge>

                  <Select
                    defaultValue={member?.role}
                    onValueChange={(val) => onRoleChange(member.id, val)}
                    disabled={!canManageRoles}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBER_ROLE_OPTIONS?.map((option) => (
                        <SelectItem key={option?.value} value={option?.value}>
                          {option?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {canRemoveMembers ||
                  (isCurrentUserOwner && member?.role !== "OWNER") ||
                  (member?.status === "INVITED" && onResendInvite) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVerticalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs">Member Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {member?.status === "INVITED" && onResendInvite ? (
                          <DropdownMenuItem
                            className="gap-2 text-xs"
                            onClick={() => onResendInvite(member.email, member.role)}
                          >
                            <RefreshCw className="size-3.5" /> Resend Invite
                          </DropdownMenuItem>
                        ) : null}
                        {isCurrentUserOwner &&
                          member?.role !== "OWNER" &&
                          member?.status === "ACTIVE" &&
                          onTransferOwnership && (
                            <DropdownMenuItem
                              className="gap-2 text-xs text-amber-600 focus:text-amber-600 dark:text-amber-400"
                              onClick={() => onTransferOwnership(member.id, member.name)}
                            >
                              <ShieldAlert className="size-3.5" /> Transfer Ownership
                            </DropdownMenuItem>
                          )}
                        {canRemoveMembers && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive gap-2 text-xs"
                            onClick={() => onRemoveMember(member.id, member.name)}
                          >
                            <Trash2Icon className="size-3.5" />{" "}
                            {member?.status === "INVITED"
                              ? "Revoke Invitation"
                              : "Remove from Organization"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
