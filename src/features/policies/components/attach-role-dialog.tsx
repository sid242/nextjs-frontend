"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ControlledSelect, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantRoles } from "@/features/rbac";
import { useActiveTenant } from "@/features/tenants";

import { useAttachPolicyToRole } from "../queries";
import type { Policy } from "../types";

const attachRoleSchema = z.object({
  roleId: z.string().min(1, "Please select a workspace role"),
});

type AttachRoleInput = z.infer<typeof attachRoleSchema>;

interface AttachRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
}

function AttachRoleFormInner({ policy, onClose }: { policy: Policy; onClose: () => void }) {
  const { activeTenant } = useActiveTenant();
  const { data: roles = [] } = useTenantRoles(activeTenant?.id);
  const attachMutation = useAttachPolicyToRole();

  const methods = useForm<AttachRoleInput>({
    resolver: zodResolver(attachRoleSchema),
    defaultValues: {
      roleId: "",
    },
  });

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: `${role.name} ${role.isSystem ? "(System)" : ""}`,
        value: role.id,
      })),
    [roles],
  );

  const onSubmit = async (values: AttachRoleInput) => {
    await attachMutation.mutateAsync({
      policyId: policy.id,
      roleId: values.roleId,
    });
    methods.reset();
    onClose();
  };

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
      <ControlledSelect
        control={methods.control}
        name="roleId"
        label="Select Workspace Role"
        placeholder="Choose a role..."
        options={roleOptions}
        required
      />

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={attachMutation.isPending}
        >
          Cancel
        </Button>
        <SubmitButton pending={attachMutation.isPending} pendingText="Attaching...">
          Attach Policy
        </SubmitButton>
      </DialogFooter>
    </FormWrapper>
  );
}

export function AttachRoleDialog({ open, onOpenChange, policy }: AttachRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach Policy to Role</DialogTitle>
          <DialogDescription>
            Attach &quot;{policy?.name}&quot; to a role. Any member or group assigned this role will
            inherit this policy&apos;s condition rules.
          </DialogDescription>
        </DialogHeader>

        {open && policy && (
          <AttachRoleFormInner policy={policy} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
