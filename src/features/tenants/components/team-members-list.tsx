import { MailIcon, MoreVerticalIcon, SearchIcon, Trash2Icon } from "lucide-react";

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

interface TeamMembersListProps {
  members: TenantMember[];
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

export function TeamMembersList({
  members = [],
  isLoading = false,
  searchQuery,
  onSearchChange,
  onRoleChange,
  onRemoveMember,
}: TeamMembersListProps) {
  const filteredMembers = members.filter(
    (m: TenantMember) =>
      m?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground animate-pulse text-sm">Loading members…</div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm font-medium">No members found</p>
            <p className="text-muted-foreground/70 mt-1 text-xs">
              Try refining your search query or invite a new collaborator.
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
                    <span className="text-foreground text-sm font-semibold">{member?.name}</span>
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs">Member Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive gap-2 text-xs"
                        onClick={() => onRemoveMember(member.id, member.name)}
                      >
                        <Trash2Icon className="size-3.5" /> Remove from Organization
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
