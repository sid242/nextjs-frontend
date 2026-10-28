"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import { useTenantSubscription } from "@/features/plans";
import {
  hasTenantPermission,
  InviteMemberDialog,
  TeamMembersList,
  TeamStatsCards,
  TENANT_PERMISSIONS,
  TenantPermissionGate,
  useActiveTenant,
  useAddTenantMember,
  useRemoveTenantMember,
  useTenantContext,
  useTenantMembers,
  useTransferTenantOwnership,
  useUpdateMemberRole,
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
  const { data: members = [], isLoading } = useTenantMembers(activeTenantId);
  const { data: subscription } = useTenantSubscription();

  const addMemberMutation = useAddTenantMember(activeTenantId ?? "");
  const removeMemberMutation = useRemoveTenantMember(activeTenantId ?? "");
  const updateRoleMutation = useUpdateMemberRole(activeTenantId ?? "");
  const transferOwnershipMutation = useTransferTenantOwnership(activeTenantId ?? "");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);

  const handleInvite = async (email: string, role: string) => {
    if (!email || !activeTenantId) return;
    try {
      const result = await addMemberMutation.mutateAsync({
        email,
        role,
      });
      if (result?.inviteUrl) {
        toast.success(`Invitation sent to ${email}`, {
          description: "Magic invite link generated! You can copy it directly to test.",
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
          {canInvite ? (
            <Button
              onClick={() => setInviteOpen(true)}
              className="w-full gap-2 shadow-sm sm:w-auto"
            >
              <PlusIcon className="size-4" /> Invite Member
            </Button>
          ) : null}
        </div>

        <TeamStatsCards totalMembers={members.length} activeMembers={activeCount} />

        <TeamMembersList
          members={members}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRoleChange={handleRoleChange}
          onRemoveMember={handleRemove}
          onTransferOwnership={(id, name) => setTransferTarget({ id, name })}
          onResendInvite={handleInvite}
          isCurrentUserOwner={isCurrentUserOwner}
          canManageRoles={canManageRoles}
          canRemoveMembers={canRemoveMembers}
        />

        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          activeTenantName={activeTenant?.name}
          onInvite={handleInvite}
          isInviting={addMemberMutation.isPending}
          remainingSeats={subscription?.usage?.remainingSeats}
          maxMembers={subscription?.usage?.maxMembers}
          activeMembers={subscription?.usage?.activeMembers}
          planName={subscription?.plan?.name}
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
      </div>
    </TenantPermissionGate>
  );
}
