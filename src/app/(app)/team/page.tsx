"use client";

import { useState } from "react";
import {
  MailIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEMBER_ROLE_OPTIONS,
  ROLE_OPTIONS,
  useActiveTenant,
  useAddTenantMember,
  useRemoveTenantMember,
  useTenantMembers,
  useUpdateMemberRole,
  type TenantMember,
} from "@/features/tenants";
import { initials } from "@/lib/format";

interface InviteFormState {
  isOpen: boolean;
  email: string;
  role: string;
}

const INITIAL_INVITE_STATE: InviteFormState = {
  isOpen: false,
  email: "",
  role: "MEMBER",
};

export default function TeamPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: members = [], isLoading } = useTenantMembers(activeTenantId);

  const addMemberMutation = useAddTenantMember(activeTenantId ?? "");
  const removeMemberMutation = useRemoveTenantMember(activeTenantId ?? "");
  const updateRoleMutation = useUpdateMemberRole(activeTenantId ?? "");

  const [inviteState, setInviteState] = useState<InviteFormState>(INITIAL_INVITE_STATE);
  const [searchQuery, setSearchQuery] = useState("");

  const handleInvite = async () => {
    const trimmedEmail = inviteState?.email?.trim() ?? "";
    if (!trimmedEmail || !activeTenantId) return;
    try {
      await addMemberMutation.mutateAsync({
        email: trimmedEmail,
        role: inviteState?.role ?? "MEMBER",
      });
      toast.success(`Invitation sent to ${trimmedEmail}`);
      setInviteState(INITIAL_INVITE_STATE);
    } catch {
      toast.error("Failed to send invitation. Please check the email address.");
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!activeTenantId) return;
    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast.success(`${memberName} has been removed from the organization.`);
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!activeTenantId) return;
    try {
      await updateRoleMutation.mutateAsync({ memberId, role: newRole });
      toast.success("Member role updated successfully.");
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const filteredMembers = members.filter(
    (m: TenantMember) =>
      m?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = members.filter((m: TenantMember) => m?.status === "ACTIVE").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Team Management"
          description={`Manage members, permissions, and role assignments for ${activeTenant?.name ?? "your organization"}.`}
        />
        <Button
          onClick={() => setInviteState((prev) => ({ ...prev, isOpen: true }))}
          className="w-full gap-2 shadow-sm sm:w-auto"
        >
          <PlusIcon className="size-4" /> Invite Member
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Total Members</CardDescription>
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <UsersIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">Assigned to active workspace</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Active Status</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserCheckIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount} Active</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {members.length - activeCount} pending or invited
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">RBAC Security</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <ShieldIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dynamic RBAC</div>
            <p className="text-muted-foreground mt-1 text-xs">Role-scoped token validation</p>
          </CardContent>
        </Card>
      </div>

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
              onChange={(e) => setSearchQuery(e?.target?.value ?? "")}
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
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid leading-tight">
                      <span className="text-foreground text-sm font-semibold">{member.name}</span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <MailIcon className="size-3" />
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Badge
                      variant={
                        member.status === "ACTIVE"
                          ? "outline"
                          : member.status === "INVITED"
                            ? "secondary"
                            : "default"
                      }
                      className="text-[11px] tracking-wider uppercase"
                    >
                      {member.status}
                    </Badge>

                    <Select
                      defaultValue={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val)}
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
                          onClick={() => handleRemove(member.id, member.name)}
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

      {/* Invite Member Dialog */}
      <Dialog
        open={inviteState?.isOpen}
        onOpenChange={(isOpen) => setInviteState((prev) => ({ ...prev, isOpen }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join {activeTenant?.name ?? "this workspace"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteState?.email ?? ""}
                onChange={(e) =>
                  setInviteState((prev) => ({ ...prev, email: e?.target?.value ?? "" }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invite-role">Assign Role</Label>
              <Select
                value={inviteState?.role ?? "MEMBER"}
                onValueChange={(role) => setInviteState((prev) => ({ ...prev, role }))}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS?.map((option) => (
                    <SelectItem key={option?.value} value={option?.value}>
                      {option?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteState(INITIAL_INVITE_STATE)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!(inviteState?.email?.trim() ?? "") || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? "Inviting…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
