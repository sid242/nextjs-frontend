"use client";

import { useMemo, useState } from "react";
import { GitFork, ListFilter, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressBook } from "@/features/addresses";
import { useTenantSubscription } from "@/features/plans";
import { useTenantRoles } from "@/features/rbac";
import {
  BulkImportMembersDialog,
  exportTenantMembers,
  hasTenantPermission,
  InviteMemberDialog,
  MemberDrawer,
  OffboardMemberDialog,
  TeamMembersList,
  TeamOrgChart,
  TeamStatsCards,
  TENANT_PERMISSIONS,
  TenantPermissionGate,
  useActiveTenant,
  useAddTenantMember,
  useOffboardTenantMember,
  useRemoveTenantMember,
  useTenantContext,
  useTenantMembers,
  useTransferTenantOwnership,
  useUpdateMemberRole,
  type TenantMember,
} from "@/features/tenants";

export default function TeamPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: tenantContext } = useTenantContext(activeTenantId);
  const permissions = tenantContext?.permissions;
  const isCurrentUserOwner = Boolean(tenantContext?.membership?.roles?.includes("OWNER"));
  const canInvite = hasTenantPermission(permissions, TENANT_PERMISSIONS.MEMBERS_INVITE);
  const canManageRoles = hasTenantPermission(permissions, [
    TENANT_PERMISSIONS.ROLES_ASSIGN,
    TENANT_PERMISSIONS.MEMBERS_UPDATE,
  ]);
  const canRemoveMembers = hasTenantPermission(permissions, TENANT_PERMISSIONS.MEMBERS_DELETE);
  const canUpdateMembers = hasTenantPermission(permissions, TENANT_PERMISSIONS.MEMBERS_UPDATE);
  const { data: members = [], isLoading } = useTenantMembers(activeTenantId);
  const { data: subscription } = useTenantSubscription();
  const { data: tenantRoles = [] } = useTenantRoles(activeTenantId);

  const addMemberMutation = useAddTenantMember(activeTenantId ?? "");
  const removeMemberMutation = useRemoveTenantMember(activeTenantId ?? "");
  const offboardMutation = useOffboardTenantMember(activeTenantId ?? "");
  const updateRoleMutation = useUpdateMemberRole(activeTenantId ?? "");
  const transferOwnershipMutation = useTransferTenantOwnership(activeTenantId ?? "");

  const [viewMode, setViewMode] = useState<"directory" | "org-chart">("directory");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerMember, setDrawerMember] = useState<TenantMember | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<TenantMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
  const [addressMember, setAddressMember] = useState<{ id: string; name: string } | null>(null);

  const handleExportMembers = async () => {
    if (!activeTenantId) return;
    try {
      await exportTenantMembers(activeTenantId, "csv");
      toast.success("Team members exported successfully.");
    } catch {
      toast.error("Failed to export team members.");
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!email || !activeTenantId) return;
    try {
      const result = await addMemberMutation.mutateAsync({
        email,
        role,
      });
      const showDevTokens = process.env.NEXT_PUBLIC_SHOW_DEV_TOKENS === "true";
      if (showDevTokens && result?.inviteUrl) {
        toast.success(`Invitation sent to ${email}`, {
          description: "Developer testing invite link generated.",
          action: {
            label: "Copy Link",
            onClick: () => {
              void navigator.clipboard.writeText(result.inviteUrl!);
              toast.info("Invite link copied to clipboard");
            },
          },
          duration: 10000,
        });
      } else {
        toast.success(`Invitation sent to ${email}`);
      }
      setInviteOpen(false);
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

  const handleOffboard = async (memberId: string, reassignToMemberId?: string, reason?: string) => {
    if (!activeTenantId) return;
    try {
      await offboardMutation.mutateAsync({
        memberId,
        input: {
          reassignToMemberId,
          reason,
        },
      });
      toast.success("Team member has been offboarded successfully.");
      setOffboardTarget(null);
    } catch {
      toast.error("Failed to offboard team member.");
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

  const handleTransferOwnership = async () => {
    if (!transferTarget || !activeTenantId) return;
    try {
      await transferOwnershipMutation.mutateAsync({
        memberId: transferTarget.id,
        newRoleForFormerOwner: "ADMIN",
      });
      toast.success(`Organization ownership successfully transferred to ${transferTarget.name}.`);
      setTransferTarget(null);
    } catch {
      toast.error("Failed to transfer organization ownership.");
    }
  };

  const activeCount = useMemo(() => {
    return members.filter((m) => m?.status === "ACTIVE").length;
  }, [members]);

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.MEMBERS_READ}>
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Team Management"
            description={`Manage members, permissions, and role assignments for ${activeTenant?.name ?? "your organization"}.`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-muted border-border/50 flex items-center gap-1 rounded-lg border p-1">
              <Button
                variant={viewMode === "directory" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("directory")}
                className="h-8 gap-1.5 text-xs"
              >
                <ListFilter className="size-3.5" /> Directory
              </Button>
              <Button
                variant={viewMode === "org-chart" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("org-chart")}
                className="h-8 gap-1.5 text-xs"
              >
                <GitFork className="size-3.5" /> Org Chart
              </Button>
            </div>
            {canInvite ? (
              <>
                <BulkImportMembersDialog tenantId={activeTenantId} />
                <Button onClick={() => setInviteOpen(true)} className="gap-2 shadow-sm">
                  <PlusIcon className="size-4" /> Invite Member
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <TeamStatsCards totalMembers={members.length} activeMembers={activeCount} />

        {viewMode === "directory" ? (
          <TeamMembersList
            members={members}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRoleChange={handleRoleChange}
            onRemoveMember={handleRemove}
            onOffboardMember={(member) => setOffboardTarget(member)}
            onSelectMember={(member) => setDrawerMember(member)}
            onExportMembers={handleExportMembers}
            onTransferOwnership={(id, name) => setTransferTarget({ id, name })}
            onResendInvite={canInvite ? handleInvite : undefined}
            onManageAddresses={
              canUpdateMembers ? (id, name) => setAddressMember({ id, name }) : undefined
            }
            isCurrentUserOwner={isCurrentUserOwner}
            canManageRoles={canManageRoles}
            canRemoveMembers={canRemoveMembers}
            roles={tenantRoles}
          />
        ) : (
          <TeamOrgChart tenantId={activeTenantId} />
        )}

        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          activeTenantName={activeTenant?.name}
          onInvite={handleInvite}
          isInviting={addMemberMutation.isPending}
          remainingSeats={subscription?.usage?.remainingSeats ?? undefined}
          maxMembers={subscription?.usage?.maxMembers ?? undefined}
          activeMembers={subscription?.usage?.occupiedSeats ?? subscription?.usage?.activeMembers}
          planName={subscription?.plan?.name}
          roles={tenantRoles}
        />

        <ConfirmDialog
          open={Boolean(transferTarget)}
          onOpenChange={(open) => !open && setTransferTarget(null)}
          title="Transfer Workspace Ownership"
          description={`Are you sure you want to transfer primary ownership of ${activeTenant?.name ?? "this organization"} to ${transferTarget?.name}? You will be reassigned to the Admin role and will no longer be the primary owner.`}
          confirmLabel="Transfer Ownership"
          destructive
          pending={transferOwnershipMutation.isPending}
          onConfirm={handleTransferOwnership}
        />

        <OffboardMemberDialog
          open={Boolean(offboardTarget)}
          onOpenChange={(open) => !open && setOffboardTarget(null)}
          member={offboardTarget}
          activeMembers={members}
          onOffboard={handleOffboard}
          isPending={offboardMutation.isPending}
        />

        <MemberDrawer
          open={Boolean(drawerMember)}
          onOpenChange={(open) => !open && setDrawerMember(null)}
          member={drawerMember}
          onRoleChange={handleRoleChange}
          onOffboardMember={(m) => {
            setDrawerMember(null);
            setOffboardTarget(m);
          }}
          onManageAddresses={
            canUpdateMembers ? (id, name) => setAddressMember({ id, name }) : undefined
          }
          canManageRoles={canManageRoles}
          canRemoveMembers={canRemoveMembers}
          roles={tenantRoles}
        />

        <Dialog
          open={Boolean(addressMember)}
          onOpenChange={(open) => !open && setAddressMember(null)}
        >
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Addresses: {addressMember?.name}</DialogTitle>
              <DialogDescription>
                Manage physical locations and verified addresses for this team member.
              </DialogDescription>
            </DialogHeader>
            {addressMember && (
              <AddressBook
                scope={{ kind: "member", memberId: addressMember.id }}
                title="Member Addresses"
                description={`Physical locations for ${addressMember.name}`}
                canWrite={canUpdateMembers}
                canDelete={canUpdateMembers}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TenantPermissionGate>
  );
}
