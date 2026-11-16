"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantRoles } from "@/features/rbac";
import { useActiveTenant } from "@/features/tenants";

import { useAttachPolicyToRole } from "../queries";
import type { Policy } from "../types";

interface AttachRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
}

export function AttachRoleDialog({ open, onOpenChange, policy }: AttachRoleDialogProps) {
  const { activeTenant } = useActiveTenant();
  const { data: roles = [] } = useTenantRoles(activeTenant?.id);
  const attachMutation = useAttachPolicyToRole();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const handleAttach = async () => {
    if (!policy || !selectedRoleId) return;
    await attachMutation.mutateAsync({
      policyId: policy.id,
      roleId: selectedRoleId,
    });
    setSelectedRoleId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Attach Policy to Role</DialogTitle>
          <DialogDescription>
            Attach &quot;{policy?.name}&quot; to a role. Any member or group assigned this role will
            inherit this policy&apos;s condition rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Workspace Role</label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} {role.isSystem ? "(System)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={!selectedRoleId || attachMutation.isPending}>
            {attachMutation.isPending ? "Attaching..." : "Attach Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
