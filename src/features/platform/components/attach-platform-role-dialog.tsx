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
import type { Policy } from "@/features/policies";

import { useAttachPlatformPolicyToRole, usePlatformRoles } from "../queries";

const attachRoleSchema = z.object({
  roleId: z.string().min(1, "Please select a platform role"),
});

type AttachRoleInput = z.infer<typeof attachRoleSchema>;

interface AttachPlatformRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: Policy | null;
}

function AttachPlatformRoleFormInner({ policy, onClose }: { policy: Policy; onClose: () => void }) {
  const { data: roles = [] } = usePlatformRoles();
  const attachMutation = useAttachPlatformPolicyToRole();

  const methods = useForm<AttachRoleInput>({
    resolver: zodResolver(attachRoleSchema),
    defaultValues: {
      roleId: "",
    },
  });

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: `${role.name} (${role.key})`,
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
        label="Select Platform Staff Role"
        placeholder="Choose an internal staff role..."
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

export function AttachPlatformRoleDialog({
  open,
  onOpenChange,
  policy,
}: AttachPlatformRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach Policy to Platform Role</DialogTitle>
          <DialogDescription>
            Attach &quot;{policy?.name}&quot; to an internal staff role. Any operator assigned this
            platform role will inherit this policy&apos;s dynamic evaluation constraints.
          </DialogDescription>
        </DialogHeader>

        {open && policy && (
          <AttachPlatformRoleFormInner policy={policy} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
