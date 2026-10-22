"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/molecules/page-header";
import { Button } from "@/components/ui/button";
import {
  InviteMemberDialog,
  TeamMembersList,
  TeamStatsCards,
  useActiveTenant,
  useAddTenantMember,
  useRemoveTenantMember,
  useTenantMembers,
  useUpdateMemberRole,
} from "@/features/tenants";

export default function TeamPage() {
  const { activeTenant, activeTenantId } = useActiveTenant();
  const { data: members = [], isLoading } = useTenantMembers(activeTenantId);

  const addMemberMutation = useAddTenantMember(activeTenantId ?? "");
  const removeMemberMutation = useRemoveTenantMember(activeTenantId ?? "");
  const updateRoleMutation = useUpdateMemberRole(activeTenantId ?? "");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const activeCount = useMemo(() => {
    return members.filter((m) => m?.status === "ACTIVE").length;
  }, [members]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Team Management"
          description={`Manage members, permissions, and role assignments for ${activeTenant?.name ?? "your organization"}.`}
        />
        <Button onClick={() => setInviteOpen(true)} className="w-full gap-2 shadow-sm sm:w-auto">
          <PlusIcon className="size-4" /> Invite Member
        </Button>
      </div>

      <TeamStatsCards totalMembers={members.length} activeMembers={activeCount} />

      <TeamMembersList
        members={members}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemove}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        activeTenantName={activeTenant?.name}
        onInvite={handleInvite}
        isInviting={addMemberMutation.isPending}
      />
    </div>
  );
}
